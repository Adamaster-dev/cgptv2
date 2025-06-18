// Index service for computing normalized Quality of Living Index from raw scenario values
import dataService from './dataService.js';

// Criterion configurations defining how each should be scored
const CRITERION_CONFIG = {
  // Climate criteria (higher raw values = worse conditions = lower scores)
  floods: {
    type: 'climate',
    invertScore: true, // Higher flood risk = lower score
    weight: 1.0,
    description: 'River flood risk index',
    category: 'Environmental Risk'
  },
  cyclones: {
    type: 'climate',
    invertScore: true, // Higher cyclone risk = lower score
    weight: 1.0,
    description: 'Tropical cyclone risk index',
    category: 'Environmental Risk'
  },
  extremeHeat: {
    type: 'climate',
    invertScore: true, // Higher heat risk = lower score
    weight: 1.0,
    description: 'Extreme heat risk index',
    category: 'Environmental Risk'
  },
  wildfires: {
    type: 'climate',
    invertScore: true, // Higher wildfire risk = lower score
    weight: 1.0,
    description: 'Wildfire risk index',
    category: 'Environmental Risk'
  },
  waterScarcity: {
    type: 'climate',
    invertScore: true, // Higher water scarcity = lower score
    weight: 1.0,
    description: 'Water scarcity risk index',
    category: 'Environmental Risk'
  },
  // Economic criteria (higher raw values = better conditions = higher scores)
  gdpPerCapita: {
    type: 'economic',
    invertScore: false, // Higher GDP = higher score
    weight: 1.0,
    description: 'GDP per capita (USD)',
    category: 'Economic Prosperity'
  },
  foodSecurity: {
    type: 'economic',
    invertScore: true, // Higher food insecurity = lower score
    weight: 1.0,
    description: 'Food insecurity percentage',
    category: 'Social Welfare'
  }
};

// Default weighting schemes
const WEIGHTING_SCHEMES = {
  equal: {
    name: 'Equal Weighting',
    description: 'All criteria weighted equally',
    weights: Object.keys(CRITERION_CONFIG).reduce((acc, key) => {
      acc[key] = 1.0;
      return acc;
    }, {})
  },
  environmentFocused: {
    name: 'Environment Focused',
    description: 'Higher weight on environmental factors',
    weights: {
      floods: 1.5,
      cyclones: 1.5,
      extremeHeat: 1.5,
      wildfires: 1.5,
      waterScarcity: 1.5,
      gdpPerCapita: 0.8,
      foodSecurity: 1.0
    }
  },
  economicFocused: {
    name: 'Economic Focused',
    description: 'Higher weight on economic factors',
    weights: {
      floods: 0.8,
      cyclones: 0.8,
      extremeHeat: 0.8,
      wildfires: 0.8,
      waterScarcity: 0.8,
      gdpPerCapita: 2.0,
      foodSecurity: 1.5
    }
  }
};

// Cache for computed statistics to avoid recalculation
let globalStatsCache = {};
let compositeIndexCache = {};
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Calculate global statistics (min, max, mean, std) for a criterion across all years and countries
 */
async function calculateGlobalStats(criterion) {
  const cacheKey = `stats_${criterion}`;
  const now = Date.now();
  
  // Return cached stats if available and fresh
  if (globalStatsCache[cacheKey] && (now - lastCacheUpdate) < CACHE_DURATION) {
    return globalStatsCache[cacheKey];
  }
  
  try {
    let data;
    if (CRITERION_CONFIG[criterion].type === 'economic') {
      data = await dataService.fetchEconomicData(criterion);
    } else {
      data = await dataService.fetchClimateData(criterion);
    }
    
    const allValues = [];
    
    // Collect all values across years and countries
    Object.keys(data).forEach(year => {
      Object.keys(data[year]).forEach(country => {
        const value = data[year][country]?.value;
        if (typeof value === 'number' && !isNaN(value)) {
          allValues.push(value);
        }
      });
    });
    
    if (allValues.length === 0) {
      throw new Error(`No valid data found for criterion: ${criterion}`);
    }
    
    // Calculate statistics
    const sortedValues = allValues.sort((a, b) => a - b);
    const min = sortedValues[0];
    const max = sortedValues[sortedValues.length - 1];
    const mean = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
    
    // Calculate standard deviation
    const variance = allValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allValues.length;
    const std = Math.sqrt(variance);
    
    // Calculate percentiles for robust scaling
    const p10 = sortedValues[Math.floor(sortedValues.length * 0.1)];
    const p90 = sortedValues[Math.floor(sortedValues.length * 0.9)];
    
    const stats = {
      min,
      max,
      mean,
      std,
      p10,
      p90,
      count: allValues.length,
      range: max - min
    };
    
    // Cache the results
    globalStatsCache[cacheKey] = stats;
    lastCacheUpdate = now;
    
    return stats;
  } catch (error) {
    console.error(`Failed to calculate global stats for ${criterion}:`, error);
    // Return default stats to prevent crashes
    return {
      min: 0,
      max: 100,
      mean: 50,
      std: 25,
      p10: 10,
      p90: 90,
      count: 0,
      range: 100
    };
  }
}

/**
 * Normalize a single value to 0-100 scale using min-max normalization with outlier handling
 */
function normalizeValue(value, stats, config) {
  if (typeof value !== 'number' || isNaN(value)) {
    return null;
  }
  
  // Use percentile-based normalization to handle outliers
  const { p10, p90 } = stats;
  const range = p90 - p10;
  
  if (range === 0) {
    return 50; // If no variation, return middle score
  }
  
  // Clamp value to percentile range to handle extreme outliers
  const clampedValue = Math.max(p10, Math.min(p90, value));
  
  // Normalize to 0-1 scale
  let normalizedValue = (clampedValue - p10) / range;
  
  // Invert if higher raw values should result in lower scores
  if (config.invertScore) {
    normalizedValue = 1 - normalizedValue;
  }
  
  // Scale to 0-100 and round to 1 decimal place
  return Math.round(normalizedValue * 1000) / 10;
}

/**
 * Normalize and score data for a specific criterion and year
 */
async function normalizeAndScoreData(criterion, year) {
  if (!CRITERION_CONFIG[criterion]) {
    throw new Error(`Unknown criterion: ${criterion}`);
  }
  
  const config = CRITERION_CONFIG[criterion];
  
  try {
    // Get raw data and global statistics
    let rawData;
    if (config.type === 'economic') {
      rawData = await dataService.fetchEconomicData(criterion);
    } else {
      rawData = await dataService.fetchClimateData(criterion);
    }
    
    const stats = await calculateGlobalStats(criterion);
    const yearData = rawData[year];
    
    if (!yearData) {
      console.warn(`No data available for ${criterion} in year ${year}`);
      return {};
    }
    
    // Normalize each country's value
    const normalizedData = {};
    
    Object.keys(yearData).forEach(country => {
      const countryData = yearData[country];
      const rawValue = countryData?.value;
      
      if (rawValue !== null && rawValue !== undefined) {
        const normalizedScore = normalizeValue(rawValue, stats, config);
        
        normalizedData[country] = {
          rawValue,
          normalizedScore,
          confidence: countryData.confidence || 0.8,
          source: countryData.source || 'Unknown',
          lastUpdated: countryData.lastUpdated || new Date().toISOString(),
          criterion,
          year,
          globalStats: {
            min: stats.min,
            max: stats.max,
            mean: stats.mean,
            percentile10: stats.p10,
            percentile90: stats.p90
          }
        };
      }
    });
    
    return normalizedData;
  } catch (error) {
    console.error(`Failed to normalize data for ${criterion} in ${year}:`, error);
    return {};
  }
}

/**
 * Get normalized scores for all criteria for a specific year
 */
async function getAllNormalizedScores(year) {
  const criteria = Object.keys(CRITERION_CONFIG);
  const results = {};
  
  // Process all criteria in parallel
  await Promise.all(criteria.map(async (criterion) => {
    try {
      results[criterion] = await normalizeAndScoreData(criterion, year);
    } catch (error) {
      console.error(`Failed to get normalized scores for ${criterion}:`, error);
      results[criterion] = {};
    }
  }));
  
  return results;
}

/**
 * Calculate composite Quality of Living Index for countries in a specific year
 */
async function calculateCompositeIndex(year, weightingScheme = 'equal') {
  const cacheKey = `composite_${year}_${weightingScheme}`;
  const now = Date.now();
  
  // Return cached results if available and fresh
  if (compositeIndexCache[cacheKey] && (now - lastCacheUpdate) < CACHE_DURATION) {
    return compositeIndexCache[cacheKey];
  }
  
  try {
    const normalizedScores = await getAllNormalizedScores(year);
    const criteria = Object.keys(CRITERION_CONFIG);
    const countries = new Set();
    
    // Get weights from scheme
    const weights = WEIGHTING_SCHEMES[weightingScheme]?.weights || WEIGHTING_SCHEMES.equal.weights;
    
    // Collect all countries that have data
    criteria.forEach(criterion => {
      Object.keys(normalizedScores[criterion] || {}).forEach(country => {
        countries.add(country);
      });
    });
    
    const compositeResults = {};
    const allCompositeScores = [];
    
    // First pass: calculate raw composite scores
    countries.forEach(country => {
      const countryScores = {};
      const validScores = [];
      let totalWeight = 0;
      let weightedSum = 0;
      let minConfidence = 1.0;
      let totalRawValue = 0;
      let categoryScores = {};
      
      // Initialize category tracking
      const categories = [...new Set(Object.values(CRITERION_CONFIG).map(c => c.category))];
      categories.forEach(category => {
        categoryScores[category] = { sum: 0, count: 0, weight: 0 };
      });
      
      // Calculate weighted average of normalized scores
      criteria.forEach(criterion => {
        const criterionData = normalizedScores[criterion][country];
        
        if (criterionData && criterionData.normalizedScore !== null) {
          const weight = weights[criterion] || 1.0;
          const score = criterionData.normalizedScore;
          const category = CRITERION_CONFIG[criterion].category;
          
          countryScores[criterion] = {
            score,
            rawValue: criterionData.rawValue,
            confidence: criterionData.confidence,
            weight,
            category,
            description: CRITERION_CONFIG[criterion].description,
            type: CRITERION_CONFIG[criterion].type,
            invertedScore: CRITERION_CONFIG[criterion].invertScore
          };
          
          validScores.push(score);
          weightedSum += score * weight;
          totalWeight += weight;
          totalRawValue += criterionData.rawValue;
          minConfidence = Math.min(minConfidence, criterionData.confidence);
          
          // Track category scores
          categoryScores[category].sum += score * weight;
          categoryScores[category].count += 1;
          categoryScores[category].weight += weight;
        }
      });
      
      // Only calculate composite index if we have data for at least half the criteria
      if (validScores.length >= Math.ceil(criteria.length / 2)) {
        const compositeScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
        allCompositeScores.push(compositeScore);
        
        // Calculate category averages
        const categoryAverages = {};
        Object.keys(categoryScores).forEach(category => {
          const catData = categoryScores[category];
          categoryAverages[category] = catData.weight > 0 ? catData.sum / catData.weight : 0;
        });
        
        compositeResults[country] = {
          compositeScore: Math.round(compositeScore * 10) / 10,
          componentScores: countryScores,
          categoryScores: categoryAverages,
          dataCompleteness: validScores.length / criteria.length,
          confidence: minConfidence,
          year,
          weightingScheme,
          totalCriteria: criteria.length,
          validCriteria: validScores.length,
          lastUpdated: new Date().toISOString()
        };
      }
    });
    
    // Second pass: add percentile rankings
    if (allCompositeScores.length > 0) {
      const sortedScores = [...allCompositeScores].sort((a, b) => b - a); // Descending order
      
      Object.keys(compositeResults).forEach(country => {
        const score = compositeResults[country].compositeScore;
        const rank = sortedScores.indexOf(score) + 1;
        const percentile = Math.round((1 - (rank - 1) / sortedScores.length) * 100);
        
        compositeResults[country].ranking = {
          rank,
          percentile,
          totalCountries: sortedScores.length
        };
      });
    }
    
    // Cache the results
    compositeIndexCache[cacheKey] = compositeResults;
    lastCacheUpdate = now;
    
    return compositeResults;
  } catch (error) {
    console.error(`Failed to calculate composite index for year ${year}:`, error);
    return {};
  }
}

/**
 * Get detailed breakdown for a specific country and year
 */
async function getCountryBreakdown(country, year, weightingScheme = 'equal') {
  try {
    const compositeData = await calculateCompositeIndex(year, weightingScheme);
    const countryData = compositeData[country];
    
    if (!countryData) {
      return null;
    }
    
    // Add additional analysis
    const breakdown = {
      ...countryData,
      country,
      analysis: {
        strengths: [],
        weaknesses: [],
        recommendations: []
      }
    };
    
    // Analyze strengths and weaknesses
    Object.keys(countryData.componentScores).forEach(criterion => {
      const criterionData = countryData.componentScores[criterion];
      const score = criterionData.score;
      
      if (score >= 75) {
        breakdown.analysis.strengths.push({
          criterion,
          score,
          description: criterionData.description,
          category: criterionData.category
        });
      } else if (score <= 25) {
        breakdown.analysis.weaknesses.push({
          criterion,
          score,
          description: criterionData.description,
          category: criterionData.category
        });
      }
    });
    
    // Generate basic recommendations
    if (breakdown.analysis.weaknesses.length > 0) {
      breakdown.analysis.recommendations.push(
        `Consider the ${breakdown.analysis.weaknesses.length} areas of concern, particularly ${breakdown.analysis.weaknesses[0].description.toLowerCase()}.`
      );
    }
    
    if (breakdown.analysis.strengths.length > 0) {
      breakdown.analysis.recommendations.push(
        `This location excels in ${breakdown.analysis.strengths.length} areas, especially ${breakdown.analysis.strengths[0].description.toLowerCase()}.`
      );
    }
    
    return breakdown;
  } catch (error) {
    console.error(`Failed to get country breakdown for ${country} in ${year}:`, error);
    return null;
  }
}

/**
 * Get top and bottom performing countries for a specific year
 */
async function getCountryRankings(year, weightingScheme = 'equal', limit = 10) {
  try {
    const compositeData = await calculateCompositeIndex(year, weightingScheme);
    const countries = Object.keys(compositeData);
    
    if (countries.length === 0) {
      return { top: [], bottom: [] };
    }
    
    // Sort by composite score
    const sortedCountries = countries
      .map(country => ({
        country,
        ...compositeData[country]
      }))
      .sort((a, b) => b.compositeScore - a.compositeScore);
    
    return {
      top: sortedCountries.slice(0, limit),
      bottom: sortedCountries.slice(-limit).reverse(),
      total: sortedCountries.length
    };
  } catch (error) {
    console.error(`Failed to get country rankings for year ${year}:`, error);
    return { top: [], bottom: [] };
  }
}

/**
 * Compare multiple countries for a specific year
 */
async function compareCountries(countries, year, weightingScheme = 'equal') {
  try {
    const compositeData = await calculateCompositeIndex(year, weightingScheme);
    const comparison = {};
    
    countries.forEach(country => {
      if (compositeData[country]) {
        comparison[country] = compositeData[country];
      }
    });
    
    return comparison;
  } catch (error) {
    console.error(`Failed to compare countries for year ${year}:`, error);
    return {};
  }
}

/**
 * Clear all caches
 */
function clearCache() {
  globalStatsCache = {};
  compositeIndexCache = {};
  lastCacheUpdate = 0;
  dataService.clearCache();
}

/**
 * Get available criteria with full configuration
 */
function getAvailableCriteria() {
  return Object.keys(CRITERION_CONFIG).map(criterion => ({
    id: criterion,
    ...CRITERION_CONFIG[criterion]
  }));
}

/**
 * Get available weighting schemes
 */
function getWeightingSchemes() {
  return WEIGHTING_SCHEMES;
}

/**
 * Create custom weighting scheme
 */
function createCustomWeightingScheme(name, description, weights) {
  const schemeId = name.toLowerCase().replace(/\s+/g, '_');
  WEIGHTING_SCHEMES[schemeId] = {
    name,
    description,
    weights: { ...WEIGHTING_SCHEMES.equal.weights, ...weights }
  };
  return schemeId;
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return {
    globalStats: Object.keys(globalStatsCache).length,
    compositeIndex: Object.keys(compositeIndexCache).length,
    lastUpdate: new Date(lastCacheUpdate).toISOString(),
    dataService: dataService.getCacheStats()
  };
}

// Export the index service
export const indexService = {
  // Core functions
  normalizeAndScoreData,
  getAllNormalizedScores,
  calculateCompositeIndex,
  getCountryBreakdown,
  
  // Analysis functions
  getCountryRankings,
  compareCountries,
  
  // Configuration functions
  getAvailableCriteria,
  getWeightingSchemes,
  createCustomWeightingScheme,
  
  // Utility functions
  clearCache,
  getCacheStats,
  calculateGlobalStats,
  normalizeValue
};

export default indexService;