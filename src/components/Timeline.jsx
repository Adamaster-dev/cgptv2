import React, { useState, useEffect, useRef } from 'react';

/**
 * Timeline Component for decade selection (2000-2100)
 * Provides visual slider indicator and clickable decade markers
 */
const Timeline = ({
  selectedYear = 2020,
  onYearChange = null,
  availableYears = null,
  className = ''
}) => {
  // Default available years if not provided
  const defaultYears = [];
  for (let year = 2000; year <= 2100; year += 10) {
    defaultYears.push(year);
  }
  
  const years = availableYears || defaultYears;
  const [currentIndex, setCurrentIndex] = useState(
    years.findIndex(year => year === selectedYear) || 0
  );

  // Update current index when selectedYear prop changes
  useEffect(() => {
    const newIndex = years.findIndex(year => year === selectedYear);
    if (newIndex !== -1 && newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  }, [selectedYear, years, currentIndex]);

  // Handle decade marker clicks
  const handleDecadeClick = (year) => {
    if (onYearChange) {
      onYearChange(year);
    }
  };

  const currentYear = years[currentIndex];
  const progress = (currentIndex / (years.length - 1)) * 100;

  // Determine timeline period description
  const getTimelinePeriod = (year) => {
    if (year <= 2020) return 'Historical Data';
    if (year <= 2050) return 'Near-term Projections';
    if (year <= 2080) return 'Mid-century Projections';
    return 'Long-term Projections';
  };

  // Get color based on timeline period
  const getTimelineColor = (year) => {
    if (year <= 2020) return 'text-blue-600 bg-blue-50';
    if (year <= 2050) return 'text-green-600 bg-green-50';
    if (year <= 2080) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
          <p className="text-sm text-gray-600">
            Click on any decade to explore data across time (2000-2100)
          </p>
        </div>
        
        {/* Current year display */}
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {currentYear}
          </div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTimelineColor(currentYear)}`}>
            {getTimelinePeriod(currentYear)}
          </div>
        </div>
      </div>

      {/* Timeline slider */}
      <div className="mb-6">
        <div className="relative">
          {/* Progress track */}
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 rounded-full transform -translate-y-1/2">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Visual slider (read-only) */}
          <input
            type="range"
            min="0"
            max={years.length - 1}
            value={currentIndex}
            readOnly
            className="relative w-full h-2 bg-transparent appearance-none timeline-slider-readonly"
            style={{
              background: 'transparent',
              pointerEvents: 'none'
            }}
          />
          
          {/* Clickable year markers */}
          <div className="flex justify-between mt-3 px-1">
            {years.map((year, index) => (
              <button
                key={year}
                onClick={() => handleDecadeClick(year)}
                className={`text-xs transition-all duration-200 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer ${
                  index === currentIndex 
                    ? 'text-gray-900 font-semibold transform scale-110 bg-gray-50' 
                    : 'text-gray-500 hover:text-gray-900 hover:font-semibold'
                }`}
                title={`Jump to ${year}`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-600">Current Year</div>
            <div className="font-semibold text-gray-900">{currentYear}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">Progress</div>
            <div className="font-semibold text-gray-900">
              {currentIndex + 1} of {years.length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">Time Range</div>
            <div className="font-semibold text-gray-900">
              {years[0]} - {years[years.length - 1]}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">Interval</div>
            <div className="font-semibold text-gray-900">10 years</div>
          </div>
        </div>
      </div>

      {/* Data confidence indicator */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-0.5">
            <div className={`w-2 h-2 rounded-full ${
              currentYear <= 2020 ? 'bg-green-500' :
              currentYear <= 2050 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
          </div>
          <div className="text-xs text-gray-600">
            {currentYear <= 2020 && (
              <span>
                <strong>Historical data:</strong> Based on observed measurements and records.
              </span>
            )}
            {currentYear > 2020 && currentYear <= 2050 && (
              <span>
                <strong>Near-term projections:</strong> High confidence climate and economic models.
              </span>
            )}
            {currentYear > 2050 && currentYear <= 2080 && (
              <span>
                <strong>Mid-century projections:</strong> Moderate confidence based on scenario modeling.
              </span>
            )}
            {currentYear > 2080 && (
              <span>
                <strong>Long-term projections:</strong> Lower confidence, high uncertainty in models.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;