import React from 'react';
import { Search, Bell, User, MapPin, Calendar } from 'lucide-react';

const Header = ({ selectedCountry, recommendedCountries }) => {
  return (
    <div className="bg-white border-b border-gray-100 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">Global Quality of Living Analysis</p>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Try searching 'New Pages Today'..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Status Indicators */}
          {selectedCountry && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
              <MapPin className="w-4 h-4" />
              <span>{selectedCountry.code}</span>
            </div>
          )}

          {recommendedCountries.length > 0 && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
              <Calendar className="w-4 h-4" />
              <span>{recommendedCountries.length} AI Picks</span>
            </div>
          )}

          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full"></span>
          </button>

          {/* User Avatar */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-medium text-gray-900">Explorer</div>
              <div className="text-xs text-gray-500">Data Analyst</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;