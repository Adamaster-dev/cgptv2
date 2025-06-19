import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  MapPin, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Star,
  Download,
  Share2,
  Target,
  Award,
  Zap,
  Map,
  Layers,
  ChevronDown,
  ChevronUp,
  Filter,
  Search
} from 'lucide-react';
import { indexService } from '../api/indexService';

/**
 * Country Profile Component - Enhanced with state/province layer support
 */
const CountryProfile = ({
  countryCode,
  selectedYear = 2020,
  weightingScheme = 'equal',
  onBack = null,
  className = ''
}) => {
  const [countryData, setCountryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [historicalData, setHistoricalData] = useState({});
  const [comparisonData, setComparisonData] = useState(null);
  const [componentScores, setComponentScores] = useState({});
  
  // State/Province layer state
  const [showSubRegional, setShowSubRegional] = useState(false);
  const [subRegionalData, setSubRegionalData] = useState({});
  const [loadingSubRegional, setLoadingSubRegional] = useState(false);
  const [selectedSubRegion, setSelectedSubRegion] = useState(null);
  const [subRegionalFilter, setSubRegionalFilter] = useState('');
  const [subRegionalSort, setSubRegionalSort] = useState('name');

  // Load country data and component scores
  useEffect(() => {
    const loadCountryData = async () => {
      if (!countryCode) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Get detailed breakdown for the country
        const breakdown = await indexService.getCountryBreakdown(countryCode, selectedYear, weightingScheme);
        
        if (!breakdown) {
          throw new Error('No data available for this country');
        }
        
        setCountryData(breakdown);
        
        // Extract and enhance component scores
        const enhancedComponentScores = {};
        Object.entries(breakdown.componentScores || {}).forEach(([criterion, data]) => {
          enhancedComponentScores[criterion] = {
            ...data,
            percentileRank: calculatePercentileRank(data.score),
            performanceLevel: getPerformanceLevel(data.score),
            trendDirection: 'stable' // Will be updated with historical data
          };
        });
        setComponentScores(enhancedComponentScores);
        
        // Load historical data for trends
        const years = [2000, 2010, 2020, 2030, 2040, 2050];
        const historical = {};
        
        await Promise.all(years.map(async (year) => {
          try {
            const yearData = await indexService.getCountryBreakdown(countryCode, year, weightingScheme);
            if (yearData) {
              historical[year] = yearData;
            }
          } catch (err) {
            console.warn(`Failed to load data for year ${year}:`, err);
          }
        }));
        
        setHistoricalData(historical);
        
        // Update trend directions based on historical data
        if (Object.keys(historical).length > 1) {
          const updatedScores = { ...enhancedComponentScores };
          Object.keys(updatedScores).forEach(criterion => {
            const trend = calculateTrendDirection(criterion, historical, selectedYear);
            updatedScores[criterion].trendDirection = trend;
          });
          setComponentScores(updatedScores);
        }
        
        // Get comparison data (top 5 countries for context)
        const rankings = await indexService.getCountryRankings(selectedYear, weightingScheme, 5);
        setComparisonData(rankings);
        
      } catch (err) {
        console.error('Failed to load country data:', err);
        setError(err.message || 'Failed to load country data');
      } finally {
        setLoading(false);
      }
    };

    loadCountryData();
  }, [countryCode, selectedYear, weightingScheme]);

  // Load sub-regional data when toggle is enabled
  useEffect(() => {
    const loadSubRegionalData = async () => {
      if (!showSubRegional || !countryCode) return;
      
      setLoadingSubRegional(true);
      
      try {
        // Generate mock sub-regional data for demonstration
        // In production, this would fetch real state/province data
        const subRegions = await generateMockSubRegionalData(countryCode, selectedYear, weightingScheme);
        setSubRegionalData(subRegions);
      } catch (err) {
        console.error('Failed to load sub-regional data:', err);
      } finally {
        setLoadingSubRegional(false);
      }
    };

    loadSubRegionalData();
  }, [showSubRegional, countryCode, selectedYear, weightingScheme]);

  // Generate mock sub-regional data
  const generateMockSubRegionalData = async (country, year, scheme) => {
    // Mock state/province data based on country
    const subRegionNames = getSubRegionNames(country);
    const subRegions = {};
    
    subRegionNames.forEach(name => {
      const baseScore = countryData?.compositeScore || 50;
      const variation = (Math.random() - 0.5) * 30; // ±15 point variation
      const score = Math.max(0, Math.min(100, baseScore + variation));
      
      subRegions[name] = {
        name,
        compositeScore: score,
        population: Math.floor(Math.random() * 10000000) + 100000,
        area: Math.floor(Math.random() * 100000) + 1000,
        componentScores: Object.keys(componentScores).reduce((acc, criterion) => {
          const baseComponentScore = componentScores[criterion]?.score || 50;
          const componentVariation = (Math.random() - 0.5) * 20;
          acc[criterion] = {
            score: Math.max(0, Math.min(100, baseComponentScore + componentVariation)),
            rawValue: componentScores[criterion]?.rawValue * (0.8 + Math.random() * 0.4),
            confidence: 0.7 + Math.random() * 0.2
          };
          return acc;
        }, {}),
        ranking: {
          rank: 0, // Will be calculated
          totalSubRegions: subRegionNames.length
        },
        lastUpdated: new Date().toISOString()
      };
    });
    
    // Calculate rankings
    const sortedRegions = Object.entries(subRegions)
      .sort(([, a], [, b]) => b.compositeScore - a.compositeScore);
    
    sortedRegions.forEach(([name], index) => {
      subRegions[name].ranking.rank = index + 1;
    });
    
    return subRegions;
  };

  // Get sub-region names based on country
  const getSubRegionNames = (country) => {
    const subRegionMap = {
      'USA': ['California', 'Texas', 'Florida', 'New York', 'Pennsylvania', 'Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'],
      'CAN': ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan', 'Nova Scotia', 'New Brunswick', 'Newfoundland and Labrador', 'Prince Edward Island'],
      'DEU': ['Bavaria', 'Baden-Württemberg', 'North Rhine-Westphalia', 'Hesse', 'Saxony', 'Lower Saxony', 'Rhineland-Palatinate', 'Schleswig-Holstein', 'Brandenburg', 'Saxony-Anhalt'],
      'FRA': ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Hauts-de-France', 'Nouvelle-Aquitaine', 'Occitanie', 'Grand Est', 'Provence-Alpes-Côte d\'Azur', 'Pays de la Loire', 'Normandy', 'Brittany'],
      'GBR': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
      'AUS': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory'],
      'BRA': ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Paraná', 'Rio Grande do Sul', 'Pernambuco', 'Ceará', 'Pará', 'Santa Catarina'],
      'IND': ['Maharashtra', 'Uttar Pradesh', 'Bihar', 'West Bengal', 'Madhya Pradesh', 'Tamil Nadu', 'Rajasthan', 'Karnataka', 'Gujarat', 'Andhra Pradesh'],
      'CHN': ['Guangdong', 'Shandong', 'Henan', 'Sichuan', 'Jiangsu', 'Hebei', 'Hunan', 'Anhui', 'Hubei', 'Zhejiang']
    };
    
    return subRegionMap[country] || ['Region 1', 'Region 2', 'Region 3', 'Region 4', 'Region 5'];
  };

  // Helper functions
  const calculatePercentileRank = (score) => {
    // Simplified percentile calculation - in production this would use global data
    if (score >= 90) return 95;
    if (score >= 80) return 85;
    if (score >= 70) return 70;
    if (score >= 60) return 55;
    if (score >= 50) return 40;
    if (score >= 40) return 25;
    if (score >= 30) return 15;
    return 5;
  };

  const getPerformanceLevel = (score) => {
    if (score >= 80) return { level: 'Excellent', color: 'green' };
    if (score >= 60) return { level: 'Good', color: 'blue' };
    if (score >= 40) return { level: 'Average', color: 'yellow' };
    if (score >= 20) return { level: 'Poor', color: 'orange' };
    return { level: 'Critical', color: 'red' };
  };

  const calculateTrendDirection = (criterion, historical, currentYear) => {
    const years = Object.keys(historical).map(Number).sort();
    const currentIndex = years.indexOf(currentYear);
    
    if (currentIndex <= 0) return 'stable';
    
    const currentScore = historical[currentYear]?.componentScores?.[criterion]?.score;
    const previousScore = historical[years[currentIndex - 1]]?.componentScores?.[criterion]?.score;
    
    if (!currentScore || !previousScore) return 'stable';
    
    const diff = currentScore - previousScore;
    if (Math.abs(diff) < 2) return 'stable';
    return diff > 0 ? 'improving' : 'declining';
  };

  const getCriterionIcon = (criterion) => {
    const iconMap = {
      floods: '🌊',
      cyclones: '🌀',
      extremeHeat: '🌡️',
      wildfires: '🔥',
      waterScarcity: '💧',
      gdpPerCapita: '💰',
      foodSecurity: '🍽️'
    };
    return iconMap[criterion] || '📊';
  };

  const getCriterionColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 20) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (score >= 60) return <TrendingUp className="w-4 h-4 text-blue-600" />;
    if (score >= 40) return <Activity className="w-4 h-4 text-yellow-600" />;
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  // Filter and sort sub-regional data
  const getFilteredAndSortedSubRegions = () => {
    let regions = Object.entries(subRegionalData);
    
    // Apply filter
    if (subRegionalFilter) {
      regions = regions.filter(([name, data]) => 
        name.toLowerCase().includes(subRegionalFilter.toLowerCase())
      );
    }
    
    // Apply sort
    regions.sort(([nameA, dataA], [nameB, dataB]) => {
      switch (subRegionalSort) {
        case 'score':
          return dataB.compositeScore - dataA.compositeScore;
        case 'population':
          return dataB.population - dataA.population;
        case 'area':
          return dataB.area - dataA.area;
        default: // name
          return nameA.localeCompare(nameB);
      }
    });
    
    return regions;
  };

  const renderComponentScoreChart = (criterion, data) => {
    const score = data.score;
    const maxScore = 100;
    const percentage = (score / maxScore) * 100;
    
    return (
      <div className="relative">
        {/* Circular progress chart */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : score >= 20 ? '#f97316' : '#ef4444'}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${percentage * 2.51} 251`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Score text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{score.toFixed(1)}</div>
              <div className="text-xs text-gray-500">/ 100</div>
            </div>
          </div>
        </div>
        
        {/* Performance indicators */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Percentile:</span>
            <span className="font-medium">{data.percentileRank}th</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Level:</span>
            <span className={`font-medium ${
              data.performanceLevel.color === 'green' ? 'text-green-600' :
              data.performanceLevel.color === 'blue' ? 'text-blue-600' :
              data.performanceLevel.color === 'yellow' ? 'text-yellow-600' :
              data.performanceLevel.color === 'orange' ? 'text-orange-600' : 'text-red-600'
            }`}>
              {data.performanceLevel.level}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Trend:</span>
            <div className="flex items-center space-x-1">
              {getTrendIcon(data.trendDirection)}
              <span className="font-medium capitalize">{data.trendDirection}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSubRegionalLayer = () => {
    if (!showSubRegional) return null;

    const filteredRegions = getFilteredAndSortedSubRegions();

    return (
      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Layers className="w-5 h-5" />
            <span>Sub-Regional Analysis</span>
            {loadingSubRegional && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </h3>
          
          <div className="flex items-center space-x-4">
            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Filter regions..."
                value={subRegionalFilter}
                onChange={(e) => setSubRegionalFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Sort selector */}
            <select
              value={subRegionalSort}
              onChange={(e) => setSubRegionalSort(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="score">Sort by Score</option>
              <option value="population">Sort by Population</option>
              <option value="area">Sort by Area</option>
            </select>
          </div>
        </div>

        {loadingSubRegional ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sub-regional data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">Total Regions</div>
                <div className="text-2xl font-bold text-blue-900">{Object.keys(subRegionalData).length}</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">Avg Score</div>
                <div className="text-2xl font-bold text-green-900">
                  {Object.values(subRegionalData).length > 0 
                    ? (Object.values(subRegionalData).reduce((sum, region) => sum + region.compositeScore, 0) / Object.values(subRegionalData).length).toFixed(1)
                    : 'N/A'
                  }
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm text-yellow-600 font-medium">Best Region</div>
                <div className="text-lg font-bold text-yellow-900">
                  {filteredRegions.length > 0 ? filteredRegions[0][0] : 'N/A'}
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium">Score Range</div>
                <div className="text-lg font-bold text-purple-900">
                  {filteredRegions.length > 0 
                    ? `${Math.min(...filteredRegions.map(([, data]) => data.compositeScore)).toFixed(1)} - ${Math.max(...filteredRegions.map(([, data]) => data.compositeScore)).toFixed(1)}`
                    : 'N/A'
                  }
                </div>
              </div>
            </div>

            {/* Sub-regional data table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Region</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Score</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Rank</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Population</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Area (km²)</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegions.map(([name, data]) => (
                    <tr 
                      key={name} 
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedSubRegion === name ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{name}</div>
                        <div className="text-sm text-gray-500">
                          {getPerformanceLevel(data.compositeScore).level} performance
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {getScoreIcon(data.compositeScore)}
                          <span className="font-bold text-lg">{data.compositeScore.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          data.ranking.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                          data.ranking.rank <= 3 ? 'bg-green-100 text-green-800' :
                          data.ranking.rank <= 5 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          #{data.ranking.rank}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-gray-700">{data.population.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-gray-700">{data.area.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => setSelectedSubRegion(selectedSubRegion === name ? null : name)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          {selectedSubRegion === name ? 'Hide' : 'Details'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Selected sub-region details */}
            {selectedSubRegion && subRegionalData[selectedSubRegion] && (
              <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">
                  {selectedSubRegion} - Detailed Analysis
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(subRegionalData[selectedSubRegion].componentScores).map(([criterion, data]) => (
                    <div key={criterion} className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-lg">{getCriterionIcon(criterion)}</span>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {componentScores[criterion]?.description || criterion}
                          </div>
                          <div className="text-xs text-gray-500">
                            {componentScores[criterion]?.category}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Score:</span>
                          <span className="font-bold">{data.score.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Raw Value:</span>
                          <span className="text-sm">{data.rawValue?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Confidence:</span>
                          <span className="text-sm">{Math.round(data.confidence * 100)}%</span>
                        </div>
                        
                        {/* Score bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              data.score >= 80 ? 'bg-green-500' :
                              data.score >= 60 ? 'bg-blue-500' :
                              data.score >= 40 ? 'bg-yellow-500' :
                              data.score >= 20 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${data.score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderComponentScoreTable = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Criterion</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-900">Score</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-900">Raw Value</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-900">Percentile</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-900">Performance</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-900">Trend</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-900">Weight</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(componentScores).map(([criterion, data]) => (
              <tr key={criterion} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getCriterionIcon(criterion)}</span>
                    <div>
                      <div className="font-medium text-gray-900">{data.description}</div>
                      <div className="text-sm text-gray-500">{data.category}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    {getScoreIcon(data.score)}
                    <span className="font-bold text-lg">{data.score.toFixed(1)}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-gray-700">{data.rawValue?.toLocaleString() || 'N/A'}</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="font-medium">{data.percentileRank}th</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    data.performanceLevel.color === 'green' ? 'bg-green-100 text-green-800' :
                    data.performanceLevel.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                    data.performanceLevel.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    data.performanceLevel.color === 'orange' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {data.performanceLevel.level}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    {getTrendIcon(data.trendDirection)}
                    <span className="text-sm capitalize">{data.trendDirection}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="font-medium">{data.weight.toFixed(1)}x</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Overall Score</h3>
              <p className="text-sm text-blue-700">Quality of Living Index</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-900 mb-2">
            {countryData.compositeScore.toFixed(1)}/100
          </div>
          {countryData.ranking && (
            <div className="text-sm text-blue-700">
              Rank #{countryData.ranking.rank} of {countryData.ranking.totalCountries} countries
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-600 rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Strengths</h3>
              <p className="text-sm text-green-700">Top performing areas</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-green-900 mb-2">
            {countryData.analysis.strengths.length}
          </div>
          <div className="text-sm text-green-700">
            Areas scoring 75+ points
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-600 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-900">Areas for Improvement</h3>
              <p className="text-sm text-orange-700">Needs attention</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-900 mb-2">
            {countryData.analysis.weaknesses.length}
          </div>
          <div className="text-sm text-orange-700">
            Areas scoring below 25 points
          </div>
        </div>
      </div>

      {/* Sub-Regional Layer Toggle */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Map className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sub-Regional Analysis</h3>
              <p className="text-sm text-gray-600">
                View detailed data for states, provinces, or regions within {countryCode}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowSubRegional(!showSubRegional)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showSubRegional 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{showSubRegional ? 'Hide' : 'Show'} Sub-Regions</span>
            {showSubRegional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        
        {showSubRegional && (
          <div className="pt-4 border-t">
            <div className="text-sm text-gray-600 mb-4">
              Sub-regional data provides insights into quality of living variations within {countryCode}. 
              This modular system can be extended to include additional criteria and administrative levels.
            </div>
            {renderSubRegionalLayer()}
          </div>
        )}
      </div>

      {/* Component Scores Visual Grid */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Component Score Breakdown</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Object.entries(componentScores).map(([criterion, data]) => (
            <div key={criterion} className={`p-4 rounded-lg border ${getCriterionColor(data.score)}`}>
              <div className="text-center">
                <div className="text-3xl mb-2">{getCriterionIcon(criterion)}</div>
                <h4 className="font-medium text-sm mb-4">{data.description}</h4>
                {renderComponentScoreChart(criterion, data)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Performance */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <PieChart className="w-5 h-5" />
          <span>Category Performance</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(countryData.categoryScores).map(([category, score]) => (
            <div key={category} className={`p-4 rounded-lg border ${getCriterionColor(score)}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{category}</h4>
                {getScoreIcon(score)}
              </div>
              <div className="text-2xl font-bold mb-1">
                {score.toFixed(1)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-current opacity-60 transition-all duration-1000"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {countryData.analysis.recommendations.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Key Insights</span>
          </h3>
          <div className="space-y-3">
            {countryData.analysis.recommendations.map((rec, index) => (
              <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailedTab = () => (
    <div className="space-y-6">
      {/* Detailed Component Scores Table */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Detailed Component Analysis</span>
        </h3>
        {renderComponentScoreTable()}
      </div>

      {/* Sub-Regional Layer in Detailed View */}
      {showSubRegional && renderSubRegionalLayer()}

      {/* Performance Distribution */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Score distribution chart */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Score Distribution</h4>
            <div className="space-y-3">
              {[
                { range: '80-100', label: 'Excellent', count: Object.values(componentScores).filter(d => d.score >= 80).length, color: 'bg-green-500' },
                { range: '60-79', label: 'Good', count: Object.values(componentScores).filter(d => d.score >= 60 && d.score < 80).length, color: 'bg-blue-500' },
                { range: '40-59', label: 'Average', count: Object.values(componentScores).filter(d => d.score >= 40 && d.score < 60).length, color: 'bg-yellow-500' },
                { range: '20-39', label: 'Poor', count: Object.values(componentScores).filter(d => d.score >= 20 && d.score < 40).length, color: 'bg-orange-500' },
                { range: '0-19', label: 'Critical', count: Object.values(componentScores).filter(d => d.score < 20).length, color: 'bg-red-500' }
              ].map(item => (
                <div key={item.range} className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded ${item.color}`}></div>
                  <div className="flex-1 flex justify-between">
                    <span className="text-sm text-gray-700">{item.label} ({item.range})</span>
                    <span className="text-sm font-medium">{item.count} criteria</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend analysis */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Trend Analysis</h4>
            <div className="space-y-3">
              {[
                { trend: 'improving', label: 'Improving', count: Object.values(componentScores).filter(d => d.trendDirection === 'improving').length, color: 'text-green-600', icon: TrendingUp },
                { trend: 'stable', label: 'Stable', count: Object.values(componentScores).filter(d => d.trendDirection === 'stable').length, color: 'text-gray-600', icon: Activity },
                { trend: 'declining', label: 'Declining', count: Object.values(componentScores).filter(d => d.trendDirection === 'declining').length, color: 'text-red-600', icon: TrendingDown }
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.trend} className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    <div className="flex-1 flex justify-between">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <span className="text-sm font-medium">{item.count} criteria</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrendsTab = () => (
    <div className="space-y-6">
      {/* Historical Trends Chart */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Historical Trends (2000-2050)</span>
        </h3>
        
        {Object.keys(historicalData).length > 0 ? (
          <div className="space-y-6">
            {/* Overall Score Trend */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Overall Quality Score Over Time</h4>
              <div className="flex items-end space-x-2 h-32">
                {Object.entries(historicalData)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([year, data]) => (
                    <div key={year} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600"
                        style={{ 
                          height: `${(data.compositeScore / 100) * 100}%`,
                          minHeight: '4px'
                        }}
                        title={`${year}: ${data.compositeScore.toFixed(1)}`}
                      />
                      <div className="text-xs text-gray-600 mt-2">{year}</div>
                      <div className="text-xs font-medium text-gray-900">
                        {data.compositeScore.toFixed(1)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Individual Criterion Trends */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(componentScores).map(criterion => (
                <div key={criterion} className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg">{getCriterionIcon(criterion)}</span>
                    <h5 className="font-medium text-gray-900 text-sm">{componentScores[criterion].description}</h5>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(historicalData)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .slice(-3) // Show last 3 data points
                      .map(([year, data]) => {
                        const score = data.componentScores?.[criterion]?.score;
                        return (
                          <div key={year} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{year}</span>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {score?.toFixed(1) || 'N/A'}
                              </span>
                              <div className="w-12 h-2 bg-gray-200 rounded-full">
                                <div 
                                  className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                                  style={{ width: `${(score || 0)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Historical data is being loaded...</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderComparisonTab = () => (
    <div className="space-y-6">
      {/* Global Context */}
      {comparisonData && (
        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Global Context</span>
          </h3>
          
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Top Performing Countries ({selectedYear})</h4>
            <div className="space-y-3">
              {comparisonData.top.map((country, index) => (
                <div 
                  key={country.country} 
                  className={`p-4 rounded-lg border transition-colors ${
                    country.country === countryCode ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{country.country}</div>
                        <div className="text-sm text-gray-600">
                          {Math.round(country.dataCompleteness * 100)}% data completeness
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {country.compositeScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {Math.round(country.confidence * 100)}% confidence
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 ${className}`}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Country Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Map</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!countryData) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 ${className}`}>
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Country Selected</h3>
          <p className="text-gray-600">Please select a country to view its detailed profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to map"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{countryCode}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{selectedYear}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BarChart3 className="w-4 h-4" />
                  <span>{weightingScheme} weighting</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Info className="w-4 h-4" />
                  <span>{Math.round(countryData.confidence * 100)}% confidence</span>
                </div>
                {showSubRegional && (
                  <div className="flex items-center space-x-1">
                    <Layers className="w-4 h-4" />
                    <span>Sub-regional view active</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Download report">
              <Download className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Share profile">
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs - Fixed */}
      <div className="flex-shrink-0 border-b">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: Star },
            { id: 'detailed', label: 'Component Analysis', icon: BarChart3 },
            { id: 'trends', label: 'Historical Trends', icon: Activity },
            { id: 'comparison', label: 'Global Comparison', icon: Globe }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'detailed' && renderDetailedTab()}
          {activeTab === 'trends' && renderTrendsTab()}
          {activeTab === 'comparison' && renderComparisonTab()}
        </div>
      </div>
    </div>
  );
};

export default CountryProfile;