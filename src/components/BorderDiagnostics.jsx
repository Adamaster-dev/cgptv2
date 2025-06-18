import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X, Download, Eye, EyeOff } from 'lucide-react';
import { BorderVerifier, ColorValidator } from '../utils/borderVerification';

/**
 * Border Diagnostics Component
 * Provides comprehensive border verification and debugging tools
 */
const BorderDiagnostics = ({ 
  geoJsonData, 
  indexData, 
  filterState, 
  recommendedCountries,
  onClose = null,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedCountry, setSelectedCountry] = useState(null);

  const borderVerifier = new BorderVerifier();
  const colorValidator = new ColorValidator();

  // Run validation when component mounts or data changes
  useEffect(() => {
    if (geoJsonData && isVisible) {
      runValidation();
    }
  }, [geoJsonData, isVisible]);

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const results = await borderVerifier.validateBorders(geoJsonData);
      setValidationResults(results);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleExportResults = () => {
    if (!validationResults) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFeatures: validationResults.totalFeatures,
        validFeatures: validationResults.validFeatures,
        invalidFeatures: validationResults.invalidFeatures
      },
      statistics: validationResults.statistics,
      issues: validationResults.issues,
      recommendations: validationResults.recommendations,
      detailedResults: borderVerifier.getAllValidationResults()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `border-validation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getIssueIcon = (type) => {
    switch (type) {
      case 'ERROR':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'INFO':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getIssueColor = (type) => {
    switch (type) {
      case 'ERROR':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'INFO':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">Valid Features</span>
          </div>
          <div className="text-2xl font-bold text-green-900 mt-2">
            {validationResults?.validFeatures || 0}
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-900">Invalid Features</span>
          </div>
          <div className="text-2xl font-bold text-red-900 mt-2">
            {validationResults?.invalidFeatures || 0}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Total Issues</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-2">
            {validationResults?.issues?.length || 0}
          </div>
        </div>
      </div>

      {/* Statistics */}
      {validationResults?.statistics && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Border Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Countries:</span>
              <span className="ml-2 font-medium">{validationResults.statistics.totalCountries}</span>
            </div>
            <div>
              <span className="text-gray-600">Avg Vertices:</span>
              <span className="ml-2 font-medium">{validationResults.statistics.averageVertexCount}</span>
            </div>
            <div>
              <span className="text-gray-600">Avg Area:</span>
              <span className="ml-2 font-medium">{validationResults.statistics.averageArea} km²</span>
            </div>
            <div>
              <span className="text-gray-600">Avg Complexity:</span>
              <span className="ml-2 font-medium">{validationResults.statistics.averageComplexity}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {validationResults?.recommendations && validationResults.recommendations.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
          <div className="space-y-3">
            {validationResults.recommendations.map((rec, index) => (
              <div key={index} className={`p-3 rounded-lg border ${
                rec.priority === 'HIGH' ? 'bg-red-50 border-red-200' :
                rec.priority === 'MEDIUM' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    rec.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {rec.priority}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{rec.category}</div>
                    <div className="text-sm text-gray-700 mt-1">{rec.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderIssuesTab = () => (
    <div className="space-y-4">
      {validationResults?.issues && validationResults.issues.length > 0 ? (
        <div className="space-y-3">
          {validationResults.issues.map((issue, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getIssueColor(issue.type)}`}>
              <div className="flex items-start space-x-3">
                {getIssueIcon(issue.type)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{issue.category}</span>
                    {issue.feature && (
                      <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                        {issue.feature}
                      </span>
                    )}
                  </div>
                  <div className="text-sm mt-1">{issue.message}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <p>No issues found! All borders are valid.</p>
        </div>
      )}
    </div>
  );

  const renderCountriesTab = () => {
    const countryResults = borderVerifier.getAllValidationResults();
    
    return (
      <div className="space-y-4">
        <div className="grid gap-3">
          {Object.entries(countryResults).map(([countryCode, validation]) => (
            <div
              key={countryCode}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedCountry === countryCode ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedCountry(selectedCountry === countryCode ? null : countryCode)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-900">
                    {validation.countryName || countryCode}
                  </span>
                  <span className="text-sm text-gray-500">({countryCode})</span>
                  {validation.isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {validation.issues?.length || 0} issues
                </div>
              </div>

              {selectedCountry === countryCode && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  {/* Metrics */}
                  {validation.metrics && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Area:</span>
                        <span className="ml-2 font-medium">{validation.metrics.areaKm2?.toLocaleString()} km²</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Vertices:</span>
                        <span className="ml-2 font-medium">{validation.metrics.vertexCount?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Perimeter:</span>
                        <span className="ml-2 font-medium">{validation.metrics.perimeterKm?.toLocaleString()} km</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Complexity:</span>
                        <span className="ml-2 font-medium">{validation.metrics.complexityRatio?.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Issues */}
                  {validation.issues && validation.issues.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-900">Issues:</h5>
                      {validation.issues.map((issue, index) => (
                        <div key={index} className={`p-2 rounded text-sm ${getIssueColor(issue.type)}`}>
                          <div className="flex items-center space-x-2">
                            {getIssueIcon(issue.type)}
                            <span className="font-medium">{issue.category}:</span>
                            <span>{issue.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Open Border Diagnostics"
      >
        <Eye className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Border Diagnostics</h3>
            <p className="text-sm text-gray-600">Comprehensive border verification and debugging</p>
          </div>
          <div className="flex items-center space-x-2">
            {validationResults && (
              <button
                onClick={handleExportResults}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            )}
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-4">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'issues', label: 'Issues' },
              { id: 'countries', label: 'Countries' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {isValidating ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Validating borders...</p>
              </div>
            </div>
          ) : validationResults ? (
            <>
              {selectedTab === 'overview' && renderOverviewTab()}
              {selectedTab === 'issues' && renderIssuesTab()}
              {selectedTab === 'countries' && renderCountriesTab()}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No validation results available</p>
              <button
                onClick={runValidation}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Run Validation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BorderDiagnostics;