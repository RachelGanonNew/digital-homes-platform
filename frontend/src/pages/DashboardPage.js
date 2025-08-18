import React from 'react';
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  HomeIcon,
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const DashboardPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Portfolio Value</p>
              <p className="text-2xl font-bold text-gray-900">$125,430</p>
            </div>
            <CurrencyDollarIcon className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">24h Change</p>
              <div className="flex items-center gap-2">
                <ArrowUpIcon className="w-5 h-5 text-green-600" />
                <p className="text-2xl font-bold text-gray-900">+2.3%</p>
              </div>
            </div>
            <ArrowTrendingUpIcon className="w-8 h-8 text-secondary-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Properties</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
            <HomeIcon className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-primary-600" />
            Performance
          </h2>
          <p className="text-gray-600">Charts and performance details will appear here.</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary-600" />
            Recent Activity
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2"><ArrowUpIcon className="w-4 h-4 text-green-600" /> Bought 10 shares of PROP_1</li>
            <li className="flex items-center gap-2"><ArrowDownIcon className="w-4 h-4 text-red-600" /> Sold 5 shares of PROP_2</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;