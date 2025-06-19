import React, { useState } from 'react';
import Map from './components/Map';
import Timeline from './components/Timeline';
import Filters from './components/Filters';
import QueryBox from './components/QueryBox';
import CountryProfile from './components/CountryProfile';
import './styles/map.css';
import './styles/timeline.css';

function App() {
  const [selectedYear, setSelectedYear] = useState(2020);
  const [weightingScheme, setWeightingScheme] = useState('equal');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [filterState, setFilterState] = useState(null);
  const [recommendedCountries, setRecommendedCountries] = useState([]);
  const [selectedCountryCodeForProfile, setSelectedCountryCodeForProfile] = useState(null);
  const [showCountryProfileOverlay, setShowCountryProfileOverlay] = useState(false);

  const handleCountryClick = (countryCode, countryData) => {
    // Only set the selected country for tooltip display
    // Do NOT trigger profile overlay here
    setSelectedCountry({ code: countryCode, data: countryData });
    console.log('Country clicked:', countryCode, countryData);
  };

  const handleCountryHover = (countryCode, countryData) => {
    // Handle hover events if needed
    // console.log('Country hovered:', countryCode, countryData);
  };

  const handleViewCountryProfile = (countryCode) => {
    // This should ONLY be called from the "View Detailed Profile" button
    console.log('Opening profile for:', countryCode);
    setSelectedCountryCodeForProfile(countryCode);
    setShowCountryProfileOverlay(true);
    // Clear the tooltip when opening profile
    setSelectedCountry(null);
  };

  const handleCloseCountryProfile = () => {
    console.log('Closing country profile');
    setShowCountryProfileOverlay(false);
    setSelectedCountryCodeForProfile(null);
    // Do NOT clear selectedCountry here - let the user click again if they want tooltip
  };

  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);
    // Clear selected country when year changes to avoid stale data
    setSelectedCountry(null);
    // Clear recommendations when year changes
    setRecommendedCountries([]);
    // Close profile if open
    if (showCountryProfileOverlay) {
      setShowCountryProfileOverlay(false);
      setSelectedCountryCodeForProfile(null);
    }
  };

  const handleFiltersChange = (newFilterState) => {
    setFilterState(newFilterState);
    // Clear selected country when filters change
    setSelectedCountry(null);
    // Close profile if open
    if (showCountryProfileOverlay) {
      setShowCountryProfileOverlay(false);
      setSelectedCountryCodeForProfile(null);
    }
  };

  const handleCountryRecommendations = (recommendations) => {
    setRecommendedCountries(recommendations || []);
    // Clear any existing country selection
    setSelectedCountry(null);
    // Close profile if open
    if (showCountryProfileOverlay) {
      setShowCountryProfileOverlay(false);
      setSelectedCountryCodeForProfile(null);
    }
  };

  const availableYears = [2000, 2010, 2020, 2030, 2040, 2050, 2060, 2070, 2080, 2090, 2100];
  const weightingSchemes = [
    { id: 'equal', name: 'Equal Weighting' },
    { id: 'environmentFocused', name: 'Environment Focused' },
    { id: 'economicFocused', name: 'Economic Focused' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Expatriation Dashboard</h1>
              <p className="text-sm text-gray-600">Global Quality of Living Index</p>
            </div>
            
            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* Year selector (now for quick access) */}
              <div className="flex items-center space-x-2">
                <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
                  Quick Year:
                </label>
                <select
                  id="year-select"
                  value={selectedYear}
                  onChange={(e) => handleYearChange(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              {/* Weighting scheme selector */}
              <div className="flex items-center space-x-2">
                <label htmlFor="scheme-select" className="text-sm font-medium text-gray-700">
                  Weighting:
                </label>
                <select
                  id="scheme-select"
                  value={weightingScheme}
                  onChange={(e) => setWeightingScheme(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {weightingSchemes.map(scheme => (
                    <option key={scheme.id} value={scheme.id}>{scheme.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - Only show when profile is NOT open */}
      {!showCountryProfileOverlay && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Timeline component */}
          <div className="mb-6">
            <Timeline
              selectedYear={selectedYear}
              onYearChange={handleYearChange}
              availableYears={availableYears}
              autoPlay={false}
              playSpeed={1500}
              className="w-full"
            />
          </div>

          {/* AI Query Box */}
          <div className="mb-6">
            <QueryBox
              selectedYear={selectedYear}
              weightingScheme={weightingScheme}
              onCountryRecommendations={handleCountryRecommendations}
              className="w-full"
            />
          </div>

          {/* Filters component */}
          <div className="mb-6">
            <Filters
              selectedYear={selectedYear}
              weightingScheme={weightingScheme}
              onFiltersChange={handleFiltersChange}
              className="w-full"
            />
          </div>

          {/* Map section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Map container */}
            <div className="h-96 lg:h-[600px]">
              <Map
                selectedYear={selectedYear}
                weightingScheme={weightingScheme}
                filterState={filterState}
                recommendedCountries={recommendedCountries}
                onCountryClick={handleCountryClick}
                onCountryHover={handleCountryHover}
                onViewCountryProfile={handleViewCountryProfile}
                className="w-full h-full"
              />
            </div>
            
            {/* Selected country info */}
            {selectedCountry && (
              <div className="border-t bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Selected: {selectedCountry.code}
                    </h3>
                    {selectedCountry.data && (
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Quality Score:</span>
                          <span className="ml-2 font-medium">
                            {selectedCountry.data.compositeScore?.toFixed(1) || 'N/A'}/100
                          </span>
                        </div>
                        {selectedCountry.data.ranking && (
                          <div>
                            <span className="text-gray-600">Global Rank:</span>
                            <span className="ml-2 font-medium">
                              #{selectedCountry.data.ranking.rank} of {selectedCountry.data.ranking.totalCountries}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Data Completeness:</span>
                          <span className="ml-2 font-medium">
                            {Math.round((selectedCountry.data.dataCompleteness || 0) * 100)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Confidence:</span>
                          <span className="ml-2 font-medium">
                            {Math.round((selectedCountry.data.confidence || 0) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                    {selectedCountry.data?.filteredBy && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Filtered by {selectedCountry.data.filteredBy}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewCountryProfile(selectedCountry.code)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      View Detailed Profile →
                    </button>
                    <button
                      onClick={() => setSelectedCountry(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI Recommendations Display */}
            {recommendedCountries.length > 0 && (
              <div className="border-t bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-blue-900">
                    AI Recommendations ({recommendedCountries.length})
                  </h3>
                  <button
                    onClick={() => setRecommendedCountries([])}
                    className="text-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recommendedCountries.slice(0, 6).map((rec, index) => (
                    <div
                      key={index}
                      className="bg-white p-3 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors cursor-pointer"
                      onClick={() => handleCountryClick(rec.countryCode || rec.country, rec.actualData)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{rec.country}</h4>
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          {rec.matchPercentage || 85}% match
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Score: {rec.score?.toFixed(1) || 'N/A'}/100
                        {rec.rank && ` • Rank #${rec.rank}`}
                      </div>
                      {rec.strengths && rec.strengths.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {rec.strengths.slice(0, 2).map((strength, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full"
                            >
                              {strength}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Info panel */}
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About the Quality of Living Index</h2>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Environmental Factors</h3>
                <ul className="space-y-1">
                  <li>• River flood risk</li>
                  <li>• Tropical cyclone risk</li>
                  <li>• Extreme heat risk</li>
                  <li>• Wildfire risk</li>
                  <li>• Water scarcity risk</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Socio-Economic Factors</h3>
                <ul className="space-y-1">
                  <li>• GDP per capita</li>
                  <li>• Food security index</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Interactive Features</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• <strong>AI Assistant:</strong> Ask natural language questions to get personalized recommendations</p>
                <p>• <strong>Timeline:</strong> Explore how conditions change over time from 2000-2100</p>
                <p>• <strong>Filters:</strong> Focus on specific criteria or set custom score thresholds</p>
                <p>• <strong>Weighting:</strong> Adjust the importance of environmental vs economic factors</p>
                <p>• <strong>Country Profiles:</strong> Click countries for tooltips, then "View Detailed Profile" for full analysis</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              * Data is aggregated from IPCC climate projections and World Bank economic indicators. 
              Scores are normalized on a 0-100 scale where higher values indicate better quality of living conditions.
              AI recommendations are powered by GPT-4 and based on the available data for the selected year and weighting scheme.
            </p>
          </div>
        </main>
      )}

      {/* Country Profile Overlay - Full screen when open */}
      {showCountryProfileOverlay && selectedCountryCodeForProfile && (
        <div className="fixed inset-0 z-50 bg-white">
          <CountryProfile
            countryCode={selectedCountryCodeForProfile}
            selectedYear={selectedYear}
            weightingScheme={weightingScheme}
            onBack={handleCloseCountryProfile}
            className="w-full h-full"
          />
        </div>
      )}
    </div>
  );
}

export default App;