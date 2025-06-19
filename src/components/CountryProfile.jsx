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
  Share2
} from 'lucide-react';
import { indexService } from '../api/indexService';

/**
 * Country Profile Component - Detailed criteria breakdown
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

  // Load country data
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

  const getTrendIcon = (current, previous) => {
    if (!previous) return null;
    const diff = current - previous;
    if (Math.abs(diff) < 1) return <Activity className="w-4 h-4 text-gray-400" />;
    return diff > 0 ? 
      <TrendingUp className="w-4 h-4 text-green-600" /> : 
      <TrendingDown className="w-4 h-4 text-red-600" />;
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
              <TrendingUp className="w-6 h-6 text-white" />
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
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-900">Areas of Concern</h3>
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

      {/* Category Breakdown */}
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
                  className="h-2 rounded-full bg-current opacity-60"
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
            <Info className="w-5 h-5" />
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
      {/* Individual Criteria */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Detailed Criteria Breakdown</span>
        </h3>
        <div className="space-y-4">
          {Object.entries(countryData.componentScores).map(([criterion, data]) => {
            const previousScore = historicalData[2010]?.componentScores?.[criterion]?.score;
            
            return (
              <div key={criterion} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getCriterionIcon(criterion)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{data.description}</h4>
                      <p className="text-sm text-gray-600">{data.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getTrendIcon(data.score, previousScore)}
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        {data.score.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Raw: {data.rawValue?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Score bar */}
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        data.score >= 80 ? 'bg-green-500' :
                        data.score >= 60 ? 'bg-blue-500' :
                        data.score >= 40 ? 'bg-yellow-500' :
                        data.score >= 20 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${data.score}%` }}
                    />
                  </div>
                </div>
                
                {/* Additional details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Weight:</span>
                    <span className="ml-2 font-medium">{data.weight.toFixed(1)}x</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Confidence:</span>
                    <span className="ml-2 font-medium">{Math.round(data.confidence * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium capitalize">{data.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Inverted:</span>
                    <span className="ml-2 font-medium">{data.invertedScore ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            );
          })}
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

            {/* Category Trends */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.keys(countryData.categoryScores).map(category => (
                <div key={category} className="p-4 border rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3">{category}</h5>
                  <div className="space-y-2">
                    {Object.entries(historicalData)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .slice(-3) // Show last 3 data points
                      .map(([year, data]) => (
                        <div key={year} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{year}</span>
                          <span className="font-medium">
                            {data.categoryScores?.[category]?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                      ))}
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
            { id: 'detailed', label: 'Detailed Analysis', icon: BarChart3 },
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