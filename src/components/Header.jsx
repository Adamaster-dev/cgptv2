import React from 'react';
import { User } from 'lucide-react';

const Header = () => {
  return (
    <div className="bg-white border-b border-gray-100 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">Global Quality of Living Analysis</p>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
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