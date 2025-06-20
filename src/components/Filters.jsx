import React, { useState, useEffect } from 'react';
import { Filter, RotateCcw, ChevronDown, ChevronUp, Info, Sliders } from 'lucide-react';
import { indexService } from '../api/indexService';

/**
 * Filters Component redesigned for sidebar integration
 */
const Filters = ({
  selectedYear = 2020,
  weightingScheme = 'equal',
  onFiltersChange = null,
  className = '',
  sidebarMode = false
}) => {
  const [isExpanded, setIsExpanded] = useState(sidebarMode); // Auto-expand in sidebar mode
  const [activeFilters, setActiveFilters] = useState(new Set());
  const [thresholds, setThresholds] = useState({});
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCriteria = async () => {
      try {
        const availableCriteria = indexService.getAvailableCriteria();
        setCriteria(availableCriteria);
        
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
    
    if (totalActive === 0) return 'Aucun filtre actif';
    if (totalActive === 1) return '1 filtre actif';
    return `${totalActive} filtres actifs`;
  };

  const getCriterionIcon = (category) => {
    switch (category) {
      case 'Environmental Risk': return '🌍';
      case 'Economic Prosperity': return '💰';
      case 'Social Welfare': return '🏥';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
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
    <div className={`${className}`}>
      {/* Header - Only show toggle in non-sidebar mode */}
      {!sidebarMode && (
        <div className="p-6 border-b border-gray-100">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-left hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Sliders className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
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
      )}

      {/* Sidebar mode header */}
      {sidebarMode && (
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>Filtres</span>
            </h4>
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1">{getFilterSummary()}</p>
        </div>
      )}

      {/* Filter Controls */}
      {(isExpanded || sidebarMode) && (
        <div className={`space-y-6 ${!sidebarMode ? 'p-6' : ''}`}>
          {/* Quick Actions - Only in non-sidebar mode */}
          {!sidebarMode && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Personnalisez vos critères d'analyse
              </div>
              <button
                onClick={handleResetFilters}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          )}

          {/* Criteria Filters */}
          <div className="space-y-4">
            <h5 className={`font-medium text-gray-900 flex items-center space-x-2 ${sidebarMode ? 'text-sm' : ''}`}>
              <span>Critères individuels</span>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  Sélectionnez les critères pour l'analyse
                </div>
              </div>
            </h5>
            
            <div className="grid gap-2">
              {criteria.map(criterion => (
                <label
                  key={criterion.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    activeFilters.has(criterion.id)
                      ? 'border-purple-200 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${sidebarMode ? 'text-sm' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={activeFilters.has(criterion.id)}
                    onChange={() => handleCriterionToggle(criterion.id)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={sidebarMode ? 'text-sm' : 'text-lg'}>{getCriterionIcon(criterion.category)}</span>
                      <div>
                        <div className={`font-medium text-gray-900 ${sidebarMode ? 'text-xs' : 'text-sm'}`}>
                          {criterion.description}
                        </div>
                        <div className={`text-gray-500 ${sidebarMode ? 'text-xs' : 'text-xs'}`}>
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
            <h5 className={`font-medium text-gray-900 flex items-center space-x-2 ${sidebarMode ? 'text-sm' : ''}`}>
              <span>Seuils de score</span>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  Définir les plages de score (échelle 0-100)
                </div>
              </div>
            </h5>
            
            <div className="space-y-3">
              {criteria.slice(0, sidebarMode ? 3 : criteria.length).map(criterion => {
                const threshold = thresholds[criterion.id] || { min: 0, max: 100, enabled: false };
                return (
                  <div
                    key={`threshold-${criterion.id}`}
                    className={`p-3 rounded-lg border transition-all ${
                      threshold.enabled
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={threshold.enabled}
                          onChange={() => handleThresholdToggle(criterion.id)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className={`font-medium text-gray-900 ${sidebarMode ? 'text-xs' : 'text-sm'}`}>
                          {criterion.description}
                        </span>
                      </label>
                    </div>
                    
                    {threshold.enabled && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`block font-medium text-gray-700 mb-1 ${sidebarMode ? 'text-xs' : 'text-xs'}`}>
                            Score Min
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={threshold.min}
                            onChange={(e) => handleThresholdChange(criterion.id, 'min', e.target.value)}
                            className={`w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${sidebarMode ? 'text-xs' : 'text-sm'}`}
                          />
                        </div>
                        <div>
                          <label className={`block font-medium text-gray-700 mb-1 ${sidebarMode ? 'text-xs' : 'text-xs'}`}>
                            Score Max
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={threshold.max}
                            onChange={(e) => handleThresholdChange(criterion.id, 'max', e.target.value)}
                            className={`w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${sidebarMode ? 'text-xs' : 'text-sm'}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Show more button in sidebar mode */}
              {sidebarMode && criteria.length > 3 && (
                <button className="w-full text-xs text-purple-600 hover:text-purple-800 py-2 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
                  Voir {criteria.length - 3} critères de plus...
                </button>
              )}
            </div>
          </div>

          {/* Active Filters Summary */}
          {(activeFilters.size > 0 || Object.values(thresholds).some(t => t.enabled)) && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h6 className={`font-medium text-blue-900 mb-2 ${sidebarMode ? 'text-xs' : 'text-sm'}`}>Filtres actifs</h6>
              <div className={`space-y-1 ${sidebarMode ? 'text-xs' : 'text-sm'}`}>
                {activeFilters.size > 0 && (
                  <div>
                    <span className="text-blue-800 font-medium">Critères: </span>
                    <span className="text-blue-700">
                      {Array.from(activeFilters).map(id => 
                        criteria.find(c => c.id === id)?.description
                      ).join(', ')}
                    </span>
                  </div>
                )}
                {Object.entries(thresholds).filter(([_, t]) => t.enabled).length > 0 && (
                  <div>
                    <span className="text-blue-800 font-medium">Seuils: </span>
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