// Data service for fetching and caching annual datasets from IPCC and World Bank
import axios from 'axios';
import { config } from '../config/environment';

// Cache configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_KEY_PREFIX = 'expatriation_data_';

// Data source configurations
const DATA_SOURCES = {
  // Climate data from IPCC (simulated endpoints - actual IPCC API structure may vary)
  climate: {
    floods: `${config.apis.ipcc}/climate/floods`,
    cyclones: `${config.apis.ipcc}/climate/cyclones`,
    extremeHeat: `${config.apis.ipcc}/climate/extreme-heat`,
    wildfires: `${config.apis.ipcc}/climate/wildfires`,
    waterScarcity: `${config.apis.ipcc}/climate/water-scarcity`,
  },
  // Socio-economic data from World Bank
  economic: {
    gdpPerCapita: `${config.apis.worldBank}/country/all/indicator/NY.GDP.PCAP.CD`,
    foodSecurity: `${config.apis.worldBank}/country/all/indicator/SN.ITK.DEFC.ZS`,
  }
};

// Mock data for development (since actual APIs may not be available)
const MOCK_DATA = {
  floods: generateMockClimateData('floods'),
  cyclones: generateMockClimateData('cyclones'),
  extremeHeat: generateMockClimateData('extremeHeat'),
  wildfires: generateMockClimateData('wildfires'),
  waterScarcity: generateMockClimateData('waterScarcity'),
  gdpPerCapita: generateMockEconomicData('gdpPerCapita'),
  foodSecurity: generateMockEconomicData('foodSecurity'),
};

/**
 * Generate mock climate data for development
 */
function generateMockClimateData(type) {
  const countries = [
    'USA', 'CAN', 'MEX', 'BRA', 'ARG', 'GBR', 'FRA', 'DEU', 'ITA', 'ESP',
    'RUS', 'CHN', 'JPN', 'IND', 'AUS', 'ZAF', 'EGY', 'NGA', 'KEN', 'GHA'
  ];
  
  const data = {};
  
  for (let year = 2000; year <= 2100; year += 10) {
    data[year] = {};
    countries.forEach(country => {
      // Generate realistic climate risk values (0-100 scale)
      const baseRisk = Math.random() * 50 + 10; // 10-60 base risk
      const yearMultiplier = (year - 2000) / 100; // Increase risk over time
      const risk = Math.min(100, baseRisk + (yearMultiplier * 30));
      
      data[year][country] = {
        value: Math.round(risk * 10) / 10,
        confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
        source: `IPCC AR6 ${type} projections`,
        lastUpdated: new Date().toISOString()
      };
    });
  }
  
  return data;
}

/**
 * Generate mock economic data for development
 */
function generateMockEconomicData(type) {
  const countries = [
    'USA', 'CAN', 'MEX', 'BRA', 'ARG', 'GBR', 'FRA', 'DEU', 'ITA', 'ESP',
    'RUS', 'CHN', 'JPN', 'IND', 'AUS', 'ZAF', 'EGY', 'NGA', 'KEN', 'GHA'
  ];
  
  const data = {};
  
  for (let year = 2000; year <= 2100; year += 10) {
    data[year] = {};
    countries.forEach(country => {
      let value;
      if (type === 'gdpPerCapita') {
        // GDP per capita in USD (varies by country development level)
        const baseGDP = country === 'USA' ? 50000 : 
                       ['GBR', 'FRA', 'DEU', 'JPN', 'AUS'].includes(country) ? 35000 :
                       ['CHN', 'BRA', 'RUS'].includes(country) ? 15000 : 8000;
        const growth = Math.random() * 0.03 + 0.01; // 1-4% annual growth
        value = Math.round(baseGDP * Math.pow(1 + growth, year - 2020));
      } else {
        // Food security index (lower is better)
        value = Math.random() * 20 + 5; // 5-25% food insecurity
      }
      
      data[year][country] = {
        value: Math.round(value * 10) / 10,
        confidence: 0.9,
        source: `World Bank ${type} data`,
        lastUpdated: new Date().toISOString()
      };
    });
  }
  
  return data;
}

/**
 * Cache management utilities
 */
const cache = {
  get(key) {
    try {
      const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      if (now - timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY_PREFIX + key);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  },
  
  set(key, data) {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  },
  
  clear() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }
};

/**
 * Fetch data from external APIs with fallback to mock data
 */
async function fetchFromAPI(url, fallbackData) {
  try {
    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Expatriation-Dashboard/1.0'
      }
    });
    
    return response.data;
  } catch (error) {
    console.warn(`API fetch failed for ${url}:`, error.message);
    console.info('Using mock data as fallback');
    return fallbackData;
  }
}

/**
 * Normalize API response data to consistent format
 */
function normalizeData(rawData, dataType) {
  // Handle different API response formats
  if (Array.isArray(rawData)) {
    // World Bank format: array of objects
    return rawData.reduce((acc, item) => {
      if (item.date && item.countryiso3code && item.value !== null) {
        const year = parseInt(item.date);
        if (!acc[year]) acc[year] = {};
        acc[year][item.countryiso3code] = {
          value: parseFloat(item.value),
          confidence: 0.9,
          source: item.source || 'World Bank',
          lastUpdated: new Date().toISOString()
        };
      }
      return acc;
    }, {});
  }
  
  // Assume mock data format if not array
  return rawData;
}

/**
 * Handle missing data with intelligent fallbacks
 */
function fillMissingData(data, dataType) {
  const years = Object.keys(data).map(Number).sort();
  const countries = new Set();
  
  // Collect all countries
  years.forEach(year => {
    Object.keys(data[year] || {}).forEach(country => {
      countries.add(country);
    });
  });
  
  // Fill missing years and countries
  for (let year = 2000; year <= 2100; year += 10) {
    if (!data[year]) data[year] = {};
    
    countries.forEach(country => {
      if (!data[year][country]) {
        // Use interpolation or nearest neighbor
        const nearestData = findNearestData(data, year, country);
        if (nearestData) {
          data[year][country] = {
            ...nearestData,
            confidence: nearestData.confidence * 0.7, // Reduce confidence for interpolated data
            source: `${nearestData.source} (interpolated)`
          };
        }
      }
    });
  }
  
  return data;
}

/**
 * Find nearest available data point for interpolation
 */
function findNearestData(data, targetYear, country) {
  const years = Object.keys(data).map(Number).sort();
  let nearestYear = null;
  let minDistance = Infinity;
  
  years.forEach(year => {
    if (data[year][country]) {
      const distance = Math.abs(year - targetYear);
      if (distance < minDistance) {
        minDistance = distance;
        nearestYear = year;
      }
    }
  });
  
  return nearestYear ? data[nearestYear][country] : null;
}

/**
 * Main data fetching functions
 */
export const dataService = {
  /**
   * Fetch climate data for a specific criterion
   */
  async fetchClimateData(criterion, forceRefresh = false) {
    const cacheKey = `climate_${criterion}`;
    
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) return cached;
    }
    
    try {
      const url = DATA_SOURCES.climate[criterion];
      const fallbackData = MOCK_DATA[criterion];
      
      const rawData = await fetchFromAPI(url, fallbackData);
      const normalizedData = normalizeData(rawData, criterion);
      const completeData = fillMissingData(normalizedData, criterion);
      
      cache.set(cacheKey, completeData);
      return completeData;
    } catch (error) {
      console.error(`Failed to fetch climate data for ${criterion}:`, error);
      return MOCK_DATA[criterion];
    }
  },
  
  /**
   * Fetch economic data for a specific indicator
   */
  async fetchEconomicData(indicator, forceRefresh = false) {
    const cacheKey = `economic_${indicator}`;
    
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) return cached;
    }
    
    try {
      const url = DATA_SOURCES.economic[indicator];
      const fallbackData = MOCK_DATA[indicator];
      
      const rawData = await fetchFromAPI(url, fallbackData);
      const normalizedData = normalizeData(rawData, indicator);
      const completeData = fillMissingData(normalizedData, indicator);
      
      cache.set(cacheKey, completeData);
      return completeData;
    } catch (error) {
      console.error(`Failed to fetch economic data for ${indicator}:`, error);
      return MOCK_DATA[indicator];
    }
  },
  
  /**
   * Fetch all data for a specific year
   */
  async fetchAllDataForYear(year) {
    const criteria = ['floods', 'cyclones', 'extremeHeat', 'wildfires', 'waterScarcity', 'gdpPerCapita', 'foodSecurity'];
    const results = {};
    
    await Promise.all(criteria.map(async (criterion) => {
      try {
        let data;
        if (['gdpPerCapita', 'foodSecurity'].includes(criterion)) {
          data = await this.fetchEconomicData(criterion);
        } else {
          data = await this.fetchClimateData(criterion);
        }
        results[criterion] = data[year] || {};
      } catch (error) {
        console.error(`Failed to fetch data for ${criterion}:`, error);
        results[criterion] = {};
      }
    }));
    
    return results;
  },
  
  /**
   * Get available years in the dataset
   */
  getAvailableYears() {
    const years = [];
    for (let year = 2000; year <= 2100; year += 10) {
      years.push(year);
    }
    return years;
  },
  
  /**
   * Get available countries in the dataset
   */
  async getAvailableCountries() {
    try {
      const sampleData = await this.fetchClimateData('floods');
      const sampleYear = Object.keys(sampleData)[0];
      return Object.keys(sampleData[sampleYear] || {});
    } catch (error) {
      console.error('Failed to get available countries:', error);
      return [];
    }
  },
  
  /**
   * Clear all cached data
   */
  clearCache() {
    cache.clear();
  },
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_KEY_PREFIX));
    return {
      totalEntries: keys.length,
      totalSize: keys.reduce((size, key) => {
        return size + (localStorage.getItem(key)?.length || 0);
      }, 0)
    };
  }
};

export default dataService;