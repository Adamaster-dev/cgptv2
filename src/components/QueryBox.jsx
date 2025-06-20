import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Loader2, MapPin, X, Lightbulb, Globe, Sparkles } from 'lucide-react';
import { llmService } from '../api/llmService';

/**
 * QueryBox Component redesigned to match dashboard UI kit - Compact version
 */
const QueryBox = ({
  selectedYear = 2020,
  weightingScheme = 'equal',
  onCountryRecommendations = null,
  className = '',
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [queryHistory, setQueryHistory] = useState([]);
  const textareaRef = useRef(null);

  // Reduced to 3 sample queries
  const sampleQueries = [
    "Je veux un climat chaud avec peu de risques d'inondation et de bonnes opportunités économiques",
    "Trouve-moi des pays avec une économie stable mais peu de menaces d'incendies",
    "Où puis-je vivre avec peu de pénurie d'eau et un PIB par habitant élevé?"
  ];

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
      }, ...prev.slice(0, 4)]);

      if (onCountryRecommendations && result.recommendations) {
        onCountryRecommendations(result.recommendations);
      }

      setQuery('');
    } catch (err) {
      console.error('Query processing failed:', err);
      setError(err.message || 'Échec du traitement de votre requête. Veuillez réessayer.');
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
    <div className={`${className}`}>
      {/* Compact Header */}
      <div className="p-4 border-b border-gray-100">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Assistant IA</h3>
              <p className="text-xs text-gray-600">
                Obtenez des recommandations personnalisées
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {response && (
              <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <MapPin className="w-3 h-3" />
                <span>{response.recommendations?.length || 0}</span>
              </div>
            )}
            {isExpanded ? (
              <X className="w-4 h-4 text-gray-400" />
            ) : (
              <MessageSquare className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </button>
      </div>

      {/* Compact Query Interface */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Compact Query Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="query-input" className="block text-xs font-medium text-gray-700 mb-2">
                Décrivez vos préférences de localisation idéale
              </label>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  id="query-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ex: Je veux un endroit chaud avec peu de risques d'inondation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  rows="2"
                  disabled={isLoading}
                />
                <div className="absolute bottom-2 right-2 flex items-center space-x-2">
                  <span className="text-xs text-gray-400">
                    Ctrl+Entrée
                  </span>
                  <button
                    type="submit"
                    disabled={!query.trim() || isLoading}
                    className="p-1.5 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-md hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Compact Sample Queries */}
          {!response && !error && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-3 h-3 text-yellow-500" />
                <span className="text-xs font-medium text-gray-700">Essayez ces exemples:</span>
              </div>
              <div className="grid gap-1">
                {sampleQueries.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => handleSampleQuery(sample)}
                    className="text-left p-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Compact Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  <X className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-medium text-red-800 mb-1">
                    Échec de la requête
                  </h4>
                  <p className="text-xs text-red-700">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="flex-shrink-0 text-red-400 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Compact Response Display */}
          {response && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                  <Globe className="w-3 h-3 text-purple-600" />
                  <span>Recommandations IA</span>
                </h4>
                <button
                  onClick={handleClearResponse}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Compact Summary */}
              {response.summary && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">{response.summary}</p>
                </div>
              )}

              {/* Compact Recommendations */}
              {response.recommendations && response.recommendations.length > 0 && (
                <div className="space-y-2">
                  {response.recommendations.slice(0, 3).map((rec, index) => (
                    <div
                      key={index}
                      className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <h6 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                            <span className="truncate">{rec.country}</span>
                            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              #{index + 1}
                            </span>
                          </h6>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-600">
                              Score: {rec.score?.toFixed(1) || 'N/A'}/100
                            </span>
                            {rec.rank && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                Rang #{rec.rank}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                          <MapPin className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-green-700 font-medium">
                            {rec.matchPercentage || 85}%
                          </span>
                        </div>
                      </div>
                      
                      {rec.reasoning && (
                        <p className="text-xs text-gray-700 mb-2 line-clamp-2">
                          {rec.reasoning}
                        </p>
                      )}
                      
                      {rec.strengths && rec.strengths.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {rec.strengths.slice(0, 2).map((strength, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full"
                            >
                              {strength}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {response.recommendations.length > 3 && (
                    <div className="text-center">
                      <span className="text-xs text-gray-500">
                        +{response.recommendations.length - 3} autres recommandations
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Compact Explanation */}
              {response.explanation && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h5 className="text-xs font-medium text-gray-900 mb-1">Détails de l'analyse</h5>
                  <p className="text-xs text-gray-700 line-clamp-3">{response.explanation}</p>
                </div>
              )}
            </div>
          )}

          {/* Compact Context Info */}
          <div className="pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 space-y-1">
              <div>Analyse: {selectedYear} • Pondération {weightingScheme}</div>
              <div>Alimenté par l'IA avec des données climatiques et économiques</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryBox;