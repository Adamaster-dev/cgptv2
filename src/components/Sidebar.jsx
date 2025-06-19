import React from 'react';
import { 
  Globe, 
  Calendar,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';

const Sidebar = ({ 
  collapsed, 
  onToggle, 
  selectedYear, 
  weightingScheme, 
  onYearChange, 
  onWeightingChange 
}) => {
  const weightingSchemes = [
    { id: 'equal', name: 'Equal', color: 'bg-green-500' },
    { id: 'environmentFocused', name: 'Environment', color: 'bg-blue-500' },
    { id: 'economicFocused', name: 'Economic', color: 'bg-purple-500' }
  ];

  return (
    <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-100 transition-all duration-300 z-50 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Expatriation</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <div className="p-4 space-y-2">
        {/* Countries */}
        <div className="relative">
          <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 bg-purple-50 text-purple-700 border border-purple-200">
            <Globe className={`w-5 h-5 ${collapsed ? 'mx-auto' : ''}`} />
            {!collapsed && (
              <>
                <span className="font-medium">Countries</span>
                <span className="ml-auto bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
                  195
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Controls */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-100 mt-auto">
          <div className="space-y-4">
            {/* Analysis Year */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Analysis Year</span>
              </label>
              <select
                value={selectedYear}
                onChange={(e) => onYearChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {[2000, 2010, 2020, 2030, 2040, 2050, 2060, 2070, 2080, 2090, 2100].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Weighting Scheme */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Weighting Scheme</span>
              </label>
              <div className="space-y-2">
                {weightingSchemes.map(scheme => (
                  <button
                    key={scheme.id}
                    onClick={() => onWeightingChange(scheme.id)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      weightingScheme === scheme.id
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${scheme.color}`}></div>
                    <span>{scheme.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;