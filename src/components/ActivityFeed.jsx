import React from 'react';
import { 
  MapPin, 
  TrendingUp, 
  Users, 
  FileText, 
  Calendar,
  MessageSquare,
  MoreHorizontal
} from 'lucide-react';

const ActivityFeed = ({ selectedCountry, recommendedCountries, selectedYear }) => {
  const activities = [
    {
      id: 1,
      type: 'country_selected',
      title: 'Country Selected',
      description: selectedCountry ? `Viewing ${selectedCountry.code} profile data` : 'No country selected',
      time: '11:32',
      user: 'Data Explorer',
      icon: MapPin,
      color: 'bg-blue-500'
    },
    {
      id: 2,
      type: 'ai_recommendation',
      title: 'AI Recommendations',
      description: `${recommendedCountries.length} countries recommended based on your preferences`,
      time: '11:28',
      user: 'AI Assistant',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      id: 3,
      type: 'year_change',
      title: 'Timeline Updated',
      description: `Analysis year changed to ${selectedYear}`,
      time: '11:25',
      user: 'Timeline Control',
      icon: Calendar,
      color: 'bg-purple-500'
    },
    {
      id: 4,
      type: 'data_update',
      title: 'Data Refresh',
      description: 'Quality of living index data updated with latest projections',
      time: '11:20',
      user: 'System',
      icon: FileText,
      color: 'bg-orange-500'
    },
    {
      id: 5,
      type: 'filter_applied',
      title: 'Filters Applied',
      description: 'Environmental risk filters activated for better analysis',
      time: '11:15',
      user: 'Filter System',
      icon: Users,
      color: 'bg-indigo-500'
    }
  ];

  const stats = [
    {
      label: 'Countries Analyzed',
      value: '195',
      change: '+12',
      color: 'text-green-600'
    },
    {
      label: 'AI Queries',
      value: '24',
      change: '+8',
      color: 'text-blue-600'
    },
    {
      label: 'Data Points',
      value: '1.2M',
      change: '+156K',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Latest Events */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Latest Events</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 ${activity.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                <activity.icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.user}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Session Stats</h3>
        </div>
        
        <div className="p-6 space-y-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
              </div>
              <div className={`text-sm font-medium ${stat.color}`}>
                {stat.change}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Assistant Quick Access */}
      <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <MessageSquare className="w-6 h-6" />
          <h3 className="text-lg font-semibold">AI Assistant</h3>
        </div>
        <p className="text-purple-100 text-sm mb-4">
          Get personalized country recommendations based on your preferences
        </p>
        <button className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium py-2 px-4 rounded-lg transition-colors">
          Ask AI Assistant
        </button>
      </div>
    </div>
  );
};

export default ActivityFeed;