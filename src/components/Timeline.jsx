import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, AlertTriangle } from 'lucide-react';

/**
 * Timeline Component for decade selection (2000-2100)
 * Redesigned to match the dashboard UI kit
 */
const Timeline = ({
  selectedYear = 2020,
  onYearChange = null,
  availableYears = null,
  className = ''
}) => {
  const defaultYears = [];
  for (let year = 2000; year <= 2100; year += 10) {
    defaultYears.push(year);
  }
  
  const years = availableYears || defaultYears;
  const [currentIndex, setCurrentIndex] = useState(
    years.findIndex(year => year === selectedYear) || 0
  );

  useEffect(() => {
    const newIndex = years.findIndex(year => year === selectedYear);
    if (newIndex !== -1 && newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  }, [selectedYear, years, currentIndex]);

  const handleDecadeClick = (year) => {
    if (onYearChange) {
      onYearChange(year);
    }
  };

  const currentYear = years[currentIndex];
  const progress = (currentIndex / (years.length - 1)) * 100;

  const getTimelinePeriod = (year) => {
    if (year <= 2020) return { label: 'Historical', color: 'text-blue-600 bg-blue-50' };
    if (year <= 2050) return { label: 'Near-term', color: 'text-green-600 bg-green-50' };
    if (year <= 2080) return { label: 'Mid-century', color: 'text-yellow-600 bg-yellow-50' };
    return { label: 'Long-term', color: 'text-red-600 bg-red-50' };
  };

  const period = getTimelinePeriod(currentYear);

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
        </div>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${period.color}`}>
          {period.label}
        </div>
      </div>

      {/* Current Year Display */}
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-gray-900 mb-2">
          {currentYear}
        </div>
        <div className="text-sm text-gray-600">
          Analysis Year • {currentIndex + 1} of {years.length}
        </div>
      </div>

      {/* Timeline Slider */}
      <div className="mb-6">
        <div className="relative">
          {/* Progress track */}
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 rounded-full transform -translate-y-1/2">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Year markers */}
          <div className="relative flex justify-between pt-4">
            {years.map((year, index) => (
              <button
                key={year}
                onClick={() => handleDecadeClick(year)}
                className={`relative transition-all duration-200 ${
                  index === currentIndex 
                    ? 'transform -translate-y-2' 
                    : 'hover:-translate-y-1'
                }`}
                title={`Jump to ${year}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 bg-white transition-all duration-200 ${
                  index === currentIndex 
                    ? 'border-purple-500 shadow-lg' 
                    : 'border-gray-300 hover:border-gray-400'
                }`} />
                <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 text-xs transition-all duration-200 ${
                  index === currentIndex 
                    ? 'text-purple-600 font-semibold' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                  {year}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{years.length}</div>
          <div className="text-xs text-gray-600">Decades</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">10yr</div>
          <div className="text-xs text-gray-600">Intervals</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{Math.round(progress)}%</div>
          <div className="text-xs text-gray-600">Progress</div>
        </div>
      </div>

      {/* Data Confidence */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {currentYear <= 2020 ? (
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            ) : currentYear <= 2050 ? (
              <TrendingUp className="w-4 h-4 text-yellow-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
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