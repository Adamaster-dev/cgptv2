import React from 'react';
import { 
  Globe, 
  Calendar,
  TrendingUp,
  Menu,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Filters from './Filters';

const Sidebar = ({ 
  collapsed, 
  onToggle, 
  selectedYear, 
  weightingScheme, 
  onYearChange, 
  onWeightingChange,
  filterState,
  onFiltersChange
}) => {
  const weightingSchemes = [
    { id: 'equal', name: 'Égal', color: 'bg-green-500' },
    { id: 'environmentFocused', name: 'Environnement', color: 'bg-blue-500' },
    { id: 'economicFocused', name: 'Économique', color: 'bg-purple-500' }
  ];

  // Get data accuracy message based on selected year
  const getDataAccuracyMessage = (year) => {
    if (year <= 2020) {
      return {
        icon: <div className="w-2 h-2 bg-green-500 rounded-full" />,
        title: "Données historiques",
        message: "Basées sur des mesures et des enregistrements observés."
      };
    } else if (year <= 2050) {
      return {
        icon: <TrendingUp className="w-4 h-4 text-yellow-500" />,
        title: "Projections à court terme",
        message: "Modèles climatiques et économiques de haute confiance."
      };
    } else if (year <= 2080) {
      return {
        icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
        title: "Projections mi-siècle",
        message: "Confiance modérée basée sur la modélisation de scénarios."
      };
    } else {
      return {
        icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
        title: "Projections à long terme",
        message: "Confiance plus faible, incertitude élevée dans les modèles."
      };
    }
  };

  const dataAccuracy = getDataAccuracyMessage(selectedYear);

  return (
    <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-100 transition-all duration-300 z-50 overflow-y-auto ${
      collapsed ? 'w-16' : 'w-80'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 truncate">Expatriation</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      {/* Content - Only show when not collapsed */}
      {!collapsed && (
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <div className="p-4 space-y-2 flex-shrink-0">
            {/* Countries */}
            <div className="relative">
              <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 bg-purple-50 text-purple-700 border border-purple-200">
                <Globe className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium truncate">Pays</span>
                <span className="ml-auto bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full flex-shrink-0">
                  195
                </span>
              </button>
            </div>
          </div>

          {/* Controls Section */}
          <div className="p-4 border-t border-gray-100 space-y-6 flex-1 overflow-y-auto">
            {/* Analysis Year */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>Année d'analyse</span>
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

            {/* Data Accuracy Message */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {dataAccuracy.icon}
                </div>
                <div className="text-xs text-gray-600 min-w-0">
                  <div className="font-medium text-gray-900 mb-1">{dataAccuracy.title}</div>
                  <div className="break-words">{dataAccuracy.message}</div>
                </div>
              </div>
            </div>

            {/* Weighting Scheme */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span>Schéma de pondération</span>
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
                    <div className={`w-3 h-3 rounded-full ${scheme.color} flex-shrink-0`}></div>
                    <span className="truncate">{scheme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filters Section */}
            <div className="border-t border-gray-100 pt-6">
              <Filters
                selectedYear={selectedYear}
                weightingScheme={weightingScheme}
                onFiltersChange={onFiltersChange}
                className="w-full"
                sidebarMode={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;