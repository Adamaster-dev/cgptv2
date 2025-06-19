import React, { useState } from 'react';
import Map from './components/Map';
import Timeline from './components/Timeline';
import Filters from './components/Filters';
import QueryBox from './components/QueryBox';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import ActivityFeed from './components/ActivityFeed';
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

  const availableYears = [2000, 2010, 2020, 2030, 2040, 2050, 2060, 2070, 2080, 2090, 2100];

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
        <Header 
          selectedCountry={selectedCountry}
          recommendedCountries={recommendedCountries}
        />

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {/* Metric Cards */}
          <MetricCards 
            selectedYear={selectedYear}
            weightingScheme={weightingScheme}
            filterState={filterState}
            recommendedCountries={recommendedCountries}
          />

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Left Column - Controls */}
            <div className="xl:col-span-1 space-y-6">
              {/* Timeline */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <Timeline
                  selectedYear={selectedYear}
                  onYearChange={handleYearChange}
                  availableYears={availableYears}
                  className="w-full"
                />
              </div>

              {/* AI Query */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <QueryBox
                  selectedYear={selectedYear}
                  weightingScheme={weightingScheme}
                  onCountryRecommendations={handleCountryRecommendations}
                  className="w-full"
                />
              </div>

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
            <div className="xl:col-span-2">
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
              </div>
            </div>

            {/* Right Column - Activity Feed */}
            <div className="xl:col-span-1">
              <ActivityFeed 
                selectedCountry={selectedCountry}
                recommendedCountries={recommendedCountries}
                selectedYear={selectedYear}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;