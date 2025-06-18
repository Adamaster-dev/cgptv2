import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Loader2, MapPin, X, Lightbulb, Globe } from 'lucide-react';
import { llmService } from '../api/llmService';

/**
 * QueryBox Component for natural-language queries with LLM recommendations
 */
const QueryBox = ({
  selectedYear = 2020,
  weightingScheme = 'equal',
  onCountryRecommendations = null,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [queryHistory, setQueryHistory] = useState([]);
  const textareaRef = useRef(null);

  // Sample queries for inspiration
  const sampleQueries = [
    "I want a warm climate with low flood risk and good economic opportunities",
    "Find countries with stable economies but minimal wildfire threats",
    "Where can I live with low water scarcity and high GDP per capita?",
    "Recommend places with minimal climate risks for raising a family",
    "I need somewhere with good food security and low cyclone risk"
  ];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await llmService.processQuery(query, selectedYear, weightingScheme);
      
      setResponse(result);
      setQueryHistory(prev => [{
        query: query.trim(),
        response: result,
        timestamp: new Date(),
        year: selectedYear,
        weightingScheme
      }, ...prev.slice(0, 4)]); // Keep last 5 queries

      // Notify parent component about recommendations
      if (onCountryRecommendations && result.recommendations) {
        onCountryRecommendations(result.recommendations);
      }

      setQuery('');
    } catch (err) {
      console.error('Query processing failed:', err);
      setError(err.message || 'Failed to process your query. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleQuery = (sampleQuery) => {
    setQuery(sampleQuery);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleClearResponse = () => {
    setResponse(null);
    setError(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
        >
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
              <p className="text-sm text-gray-600">
                Ask about ideal locations based on your preferences
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {response && (
              <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <MapPin className="w-3 h-3" />
                <span>{response.recommendations?.length || 0} found</span>
              </div>
            )}
            {isExpanded ? (
              <X className="w-5 h-5 text-gray-400" />
            ) : (
              <MessageSquare className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>
      </div>

      {/* Query Interface */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Query Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="query-input" className="block text-sm font-medium text-gray-700 mb-2">
                Describe your ideal location preferences
              </label>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  id="query-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., I want somewhere warm with low flood risk and good economic opportunities..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  disabled={isLoading}
                />
                <div className="absolute bottom-2 right-2 flex items-center space-x-2">
                  <span className="text-xs text-gray-400">
                    Ctrl+Enter to send
                  </span>
                  <button
                    type="submit"
                    disabled={!query.trim() || isLoading}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Sample Queries */}
          {!response && !error && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Try these examples:</span>
              </div>
              <div className="grid gap-2">
                {sampleQueries.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => handleSampleQuery(sample)}
                    className="text-left p-3 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <X className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800 mb-1">
                    Query Failed
                  </h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="flex-shrink-0 text-red-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Response Display */}
          {response && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">AI Recommendations</h4>
                <button
                  onClick={handleClearResponse}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Summary */}
              {response.summary && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">{response.summary}</p>
                </div>
              )}

              {/* Recommendations */}
              {response.recommendations && response.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-900 flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>Recommended Countries</span>
                  </h5>
                  <div className="grid gap-3">
                    {response.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h6 className="font-semibold text-gray-900">
                              {rec.country}
                            </h6>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm text-gray-600">
                                Quality Score: {rec.score?.toFixed(1) || 'N/A'}/100
                              </span>
                              {rec.rank && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  Rank #{rec.rank}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <span className="text-xs text-blue-600 font-medium">
                              {rec.matchPercentage || 85}% match
                            </span>
                          </div>
                        </div>
                        
                        {rec.reasoning && (
                          <p className="text-sm text-gray-700 mb-3">
                            {rec.reasoning}
                          </p>
                        )}
                        
                        {rec.strengths && rec.strengths.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-green-700">
                              Key Strengths:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {rec.strengths.map((strength, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"
                                >
                                  {strength}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {rec.considerations && rec.considerations.length > 0 && (
                          <div className="space-y-2 mt-3">
                            <div className="text-xs font-medium text-yellow-700">
                              Considerations:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {rec.considerations.map((consideration, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full"
                                >
                                  {consideration}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation */}
              {response.explanation && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Analysis Explanation</h5>
                  <p className="text-sm text-gray-700">{response.explanation}</p>
                </div>
              )}

              {/* Methodology */}
              {response.methodology && (
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                    How this analysis was performed
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-600">
                    {response.methodology}
                  </div>
                </details>
              )}
            </div>
          )}

          {/* Query History */}
          {queryHistory.length > 0 && (
            <div className="pt-4 border-t">
              <h5 className="font-medium text-gray-900 mb-3">Recent Queries</h5>
              <div className="space-y-2">
                {queryHistory.slice(0, 3).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(item.query)}
                    className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="text-gray-700 mb-1">"{item.query}"</div>
                    <div className="text-xs text-gray-500">
                      {item.response.recommendations?.length || 0} recommendations • {item.year} • {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Context Info */}
          <div className="pt-4 border-t">
            <div className="text-xs text-gray-500 space-y-1">
              <div>Current analysis context: {selectedYear} • {weightingScheme} weighting</div>
              <div>Powered by AI language model with climate and economic data</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryBox;