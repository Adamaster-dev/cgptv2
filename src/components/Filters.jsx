import React, { useState, useEffect } from 'react';
import { Filter, RotateCcw, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { indexService } from '../api/indexService';

/**
 * Filters Component for individual scenario filtering and threshold controls
 */
const Filters = ({
  selectedYear = 2020,
  weightingScheme = 'equal',
  onFiltersChange = null,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState(new Set());
  const [thresholds, setThresholds] = useState({});
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load available criteria on component mount
  useEffect(() => {
    const loadCriteria = async () => {
      try {
        const availableCriteria = indexService.getAvailableCriteria();
        setCriteria(availableCriteria);
        
        // Initialize default thresholds
        const defaultThresholds = {};
        availableCriteria.forEach(criterion => {
          defaultThresholds[criterion.id] = {
            min: 0,
            max: 100,
            enabled: false
          };
        });
        setThresholds(defaultThresholds);
      } catch (error) {
        console.error('Failed to load criteria:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCriteria();
  }, []);

  // Notify parent component when filters change
  useEffect(() => {
    if (onFiltersChange) {
      const filterState = {
        activeFilters: Array.from(activeFilters),
        thresholds,
        hasActiveFilters: activeFilters.size > 0 || Object.values(thresholds).some(t => t.enabled)
      };
      onFiltersChange(filterState);
    }
  }, [activeFilters, thresholds, onFiltersChange]);

  const handleCriterionToggle = (criterionId) => {
    const newActiveFilters = new Set(activeFilters);
    if (newActiveFilters.has(criterionId)) {
      newActiveFilters.delete(criterionId);
    } else {
      newActiveFilters.add(criterionId);
    }
    setActiveFilters(newActiveFilters);
  };

  const handleThresholdChange = (criterionId, type, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setThresholds(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        [type]: Math.max(0, Math.min(100, numValue))
      }
    }));
  };

  const handleThresholdToggle = (criterionId) => {
    setThresholds(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        enabled: !prev[criterionId]?.enabled
      }
    }));
  };

  const handleResetFilters = () => {
    setActiveFilters(new Set());
    const resetThresholds = {};
    criteria.forEach(criterion => {
      resetThresholds[criterion.id] = {
        min: 0,
        max: 100,
        enabled: false
      };
    });
    setThresholds(resetThresholds);
  };

  const getFilterSummary = () => {
    const activeCount = activeFilters.size;
    const thresholdCount = Object.values(thresholds).filter(t => t.enabled).length;
    const totalActive = activeCount + thresholdCount;
    
    if (totalActive === 0) return 'No filters active';
    if (totalActive === 1) return '1 filter active';
    return `${totalActive} filters active`;
  };

  const getCriterionIcon = (category) => {
    // Simple icon mapping based on category
    switch (category) {
      case 'Environmental Risk':
        return '🌍';
      case 'Economic Prosperity':
        return '💰';
      case 'Social Welfare':
        return '🏥';
      default:
        return '📊';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <p className="text-sm text-gray-600">{getFilterSummary()}</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Filter Controls */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Filter by individual criteria or set custom thresholds
            </div>
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>

          {/* Criteria Filters */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
              <span>Individual Criteria</span>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  Select criteria to view only those factors on the map
                </div>
              </div>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {criteria.map(criterion => (
                <label
                  key={criterion.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    activeFilters.has(criterion.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={activeFilters.has(criterion.id)}
                    onChange={() => handleCriterionToggle(criterion.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getCriterionIcon(criterion.category)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {criterion.description}
                        </div>
                        <div className="text-xs text-gray-500">
                          {criterion.category}
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Threshold Controls */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
              <span>Score Thresholds</span>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  Set minimum and maximum score ranges (0-100 scale)
                </div>
              </div>
            </h4>
            
            <div className="space-y-4">
              {criteria.map(criterion => {
                const threshold = thresholds[criterion.id] || { min: 0, max: 100, enabled: false };
                return (
                  <div
                    key={`threshold-${criterion.id}`}
                    className={`p-4 rounded-lg border transition-all ${
                      threshold.enabled
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={threshold.enabled}
                          onChange={() => handleThresholdToggle(criterion.id)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {criterion.description}
                        </span>
                      </label>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {criterion.category}
                      </span>
                    </div>
                    
                    {threshold.enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Minimum Score
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={threshold.min}
                            onChange={(e) => handleThresholdChange(criterion.id, 'min', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Maximum Score
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={threshold.max}
                            onChange={(e) => handleThresholdChange(criterion.id, 'max', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter Summary */}
          {(activeFilters.size > 0 || Object.values(thresholds).some(t => t.enabled)) && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-2">Active Filters Summary</h5>
              <div className="space-y-2 text-sm">
                {activeFilters.size > 0 && (
                  <div>
                    <span className="text-blue-800 font-medium">Individual Criteria: </span>
                    <span className="text-blue-700">
                      {Array.from(activeFilters).map(id => 
                        criteria.find(c => c.id === id)?.description
                      ).join(', ')}
                    </span>
                  </div>
                )}
                {Object.entries(thresholds).filter(([_, t]) => t.enabled).length > 0 && (
                  <div>
                    <span className="text-blue-800 font-medium">Score Thresholds: </span>
                    <div className="mt-1 space-y-1">
                      {Object.entries(thresholds)
                        .filter(([_, threshold]) => threshold.enabled)
                        .map(([criterionId, threshold]) => {
                          const criterion = criteria.find(c => c.id === criterionId);
                          return (
                            <div key={criterionId} className="text-blue-700 text-xs">
                              {criterion?.description}: {threshold.min}-{threshold.max}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Filters;