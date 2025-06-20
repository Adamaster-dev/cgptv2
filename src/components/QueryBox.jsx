import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Loader2, MapPin, X, Lightbulb, Globe, Sparkles } from 'lucide-react';
import { llmService } from '../api/llmService';

/**
 * QueryBox Component redesigned to match dashboard UI kit
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

  const sampleQueries = [
    "Je veux un climat chaud avec peu de risques d'inondation et de bonnes opportunités économiques",
    "Trouve-moi des pays avec une économie stable mais peu de menaces d'incendies",
    "Où puis-je vivre avec peu de pénurie d'eau et un PIB par habitant élevé?",
    "Recommande-moi des endroits avec des risques climatiques minimaux pour élever une famille"
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
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Assistant IA</h3>
              <p className="text-sm text-gray-600">
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
              <X className="w-5 h-5 text-gray-400" />
            ) : (
              <MessageSquare className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>
      </div>

      {/* Query Interface */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Query Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="query-input" className="block text-sm font-medium text-gray-700 mb-3">
                Décrivez vos préférences de localisation idéale
              </label>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  id="query-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ex: Je veux un endroit chaud avec peu de risques d'inondation et de bonnes opportunités économiques..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="3"
                  disabled={isLoading}
                />
                <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                  <span className="text-xs text-gray-400">
                    Ctrl+Entrée
                  </span>
                  <button
                    type="submit"
                    disabled={!query.trim() || isLoading}
                    className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
                <span className="text-sm font-medium text-gray-700">Essayez ces exemples:</span>
              </div>
              <div className="grid gap-2">
                {sampleQueries.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => handleSampleQuery(sample)}
                    className="text-left p-3 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-transparent hover:border-gray-200"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <X className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800 mb-1">
                    Échec de la requête
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
                <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-purple-600" />
                  <span>Recommandations IA</span>
                </h4>
                <button
                  onClick={handleClearResponse}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Summary */}
              {response.summary && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-800">{response.summary}</p>
                </div>
              )}

              {/* Recommendations */}
              {response.recommendations && response.recommendations.length > 0 && (
                <div className="space-y-3">
                  {response.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h6 className="font-semibold text-gray-900 flex items-center space-x-2">
                            <span>{rec.country}</span>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              #{index + 1}
                            </span>
                          </h6>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-sm text-gray-600">
                              Score: {rec.score?.toFixed(1) || 'N/A'}/100
                            </span>
                            {rec.rank && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                Rang #{rec.rank}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-full">
                          <MapPin className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-green-700 font-medium">
                            {rec.matchPercentage || 85}%
                          </span>
                        </div>
                      </div>
                      
                      {rec.reasoning && (
                        <p className="text-sm text-gray-700 mb-3">
                          {rec.reasoning}
                        </p>
                      )}
                      
                      {rec.strengths && rec.strengths.length > 0 && (
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
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Explanation */}
              {response.explanation && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h5 className="font-medium text-gray-900 mb-2">Détails de l'analyse</h5>
                  <p className="text-sm text-gray-700">{response.explanation}</p>
                </div>
              )}
            </div>
          )}

          {/* Context Info */}
          <div className="pt-4 border-t border-gray-100">
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