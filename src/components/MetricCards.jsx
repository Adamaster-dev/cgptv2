import React, { useState, useEffect } from 'react';
import { TrendingUp, Globe, Users, MapPin, Eye, BarChart3 } from 'lucide-react';
import { indexService } from '../api/indexService';

const MetricCards = ({ selectedYear, weightingScheme, filterState, recommendedCountries }) => {
  const [metrics, setMetrics] = useState({
    totalCountries: 0,
    averageScore: 0,
    topPerformers: 0,
    filteredCount: 0,
    aiRecommendations: 0,
    dataCompleteness: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      try {
        const indexData = await indexService.calculateCompositeIndex(selectedYear, weightingScheme);
        const countries = Object.keys(indexData);
        
        const scores = countries.map(country => indexData[country]?.compositeScore || 0);
        const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const topPerformers = scores.filter(score => score >= 75).length;
        
        const completenessScores = countries.map(country => indexData[country]?.dataCompleteness || 0);
        const avgCompleteness = completenessScores.length > 0 
          ? completenessScores.reduce((a, b) => a + b, 0) / completenessScores.length 
          : 0;

        setMetrics({
          totalCountries: countries.length,
          averageScore: Math.round(averageScore * 10) / 10,
          topPerformers,
          filteredCount: filterState?.hasActiveFilters ? 
            Object.keys(indexData).filter(country => {
              // Apply same filter logic as in Map component
              return true; // Simplified for now
            }).length : countries.length,
          aiRecommendations: recommendedCountries.length,
          dataCompleteness: Math.round(avgCompleteness * 100)
        });
      } catch (error) {
        console.error('Failed to load metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [selectedYear, weightingScheme, filterState, recommendedCountries]);

  const cards = [
    {
      title: 'Countries',
      value: metrics.totalCountries,
      icon: Globe,
      color: 'bg-gradient-to-br from-green-400 to-green-600',
      textColor: 'text-white',
      change: '+2.5%',
      subtitle: 'View All'
    },
    {
      title: 'Avg Score',
      value: `${metrics.averageScore}`,
      icon: BarChart3,
      color: 'bg-gradient-to-br from-purple-500 to-purple-700',
      textColor: 'text-white',
      change: '+12.3%',
      subtitle: 'Quality Index'
    },
    {
      title: 'Top Performers',
      value: metrics.topPerformers,
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-orange-400 to-red-500',
      textColor: 'text-white',
      change: '+5.1%',
      subtitle: 'Score 75+'
    },
    {
      title: 'Filtered',
      value: metrics.filteredCount,
      icon: Eye,
      color: 'bg-gradient-to-br from-blue-400 to-blue-600',
      textColor: 'text-white',
      change: filterState?.hasActiveFilters ? 'Active' : 'None',
      subtitle: 'View All'
    },
    {
      title: 'AI Picks',
      value: metrics.aiRecommendations,
      icon: MapPin,
      color: 'bg-gradient-to-br from-gray-700 to-gray-900',
      textColor: 'text-white',
      change: 'Live',
      subtitle: 'Recommended'
    },
    {
      title: 'Data Quality',
      value: `${metrics.dataCompleteness}%`,
      icon: Users,
      color: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
      textColor: 'text-white',
      change: '+1.2%',
      subtitle: 'Completeness'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.color} rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 bg-white bg-opacity-20 rounded-lg`}>
              <card.icon className={`w-5 h-5 ${card.textColor}`} />
            </div>
            <div className="text-right">
              <div className={`text-xs ${card.textColor} opacity-80`}>
                {card.change}
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className={`text-xs font-medium ${card.textColor} opacity-80 uppercase tracking-wide`}>
              {card.title}
            </div>
            <div className={`text-2xl font-bold ${card.textColor}`}>
              {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
            </div>
            <div className="flex items-center justify-between">
              <div className={`text-xs ${card.textColor} opacity-80`}>
                {card.subtitle}
              </div>
              <button className={`text-xs ${card.textColor} opacity-80 hover:opacity-100 transition-opacity`}>
                <Eye className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricCards;