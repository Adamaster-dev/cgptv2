import React, { useState } from 'react';
import Map from './components/Map';
import Filters from './components/Filters';
import QueryBox from './components/QueryBox';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import './styles/dashboard.css';

function App() {
  const [selectedYear, setSelectedYear] = useState(2020);
  const [weightingScheme, setWeightingScheme] = useState('equal');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [filterState, setFilterState] = useState(null);
  const [recommendedCountries, setRecommendedCountries] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleCountryClick = (countryCode, countryData) => {
    setSelectedCountry({ code: countryCode, data: countryData });
    console.log('Country clicked:', countryCode, countryData);
  };

  const handleCountryHover = (countryCode, countryData) => {
    // Handle hover events if needed
  };

  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);
    setSelectedCountry(null);
    setRecommendedCountries([]);
  };

  const handleFiltersChange = (newFilterState) => {
    setFilterState(newFilterState);
    setSelectedCountry(null);
  };

  const handleCountryRecommendations = (recommendations) => {
    setRecommendedCountries(recommendations || []);
    setSelectedCountry(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        selectedYear={selectedYear}
        weightingScheme={weightingScheme}
        onYearChange={handleYearChange}
        onWeightingChange={setWeightingScheme}
      />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <Header />

        {/* Main Title */}
        <div className="px-6 py-6 border-b border-gray-100 bg-white">
          <h1 className="text-4xl font-bold text-gray-900">Alors on bouge où babe?</h1>
          <p className="text-lg text-gray-600 mt-2">Découvrez votre destination idéale grâce à l'analyse climatique et économique</p>
        </div>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {/* AI Assistant - Top of page, expanded by default */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <QueryBox
              selectedYear={selectedYear}
              weightingScheme={weightingScheme}
              onCountryRecommendations={handleCountryRecommendations}
              className="w-full"
              defaultExpanded={true}
            />
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Left Column - Filters only */}
            <div className="xl:col-span-1 space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <Filters
                  selectedYear={selectedYear}
                  weightingScheme={weightingScheme}
                  onFiltersChange={handleFiltersChange}
                  className="w-full"
                />
              </div>
            </div>

            {/* Center Column - Map */}
            <div className="xl:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-[600px]">
                  <Map
                    selectedYear={selectedYear}
                    weightingScheme={weightingScheme}
                    filterState={filterState}
                    recommendedCountries={recommendedCountries}
                    onCountryClick={handleCountryClick}
                    onCountryHover={handleCountryHover}
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
                      </div>
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
                )}

                {/* AI Recommendations Display */}
                {recommendedCountries.length > 0 && (
                  <div className="border-t bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-blue-900">
                        Recommandations IA ({recommendedCountries.length})
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
                            {rec.rank && ` • Rang #${rec.rank}`}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;