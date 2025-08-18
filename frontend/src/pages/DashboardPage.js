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
<<<<<<< HEAD

        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Portfolio Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${portfolio.total_value.toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  <ArrowUpIcon className="w-4 h-4 text-secondary-600 mr-1" />
                  <span className="text-secondary-600 text-sm font-medium">
                    +{portfolio.return_percentage.toFixed(2)}%
                  </span>
                </div>
              </div>
              <ChartBarIcon className="w-8 h-8 text-primary-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Return</p>
                  <p className="text-2xl font-bold text-secondary-600">
                    +${portfolio.total_return.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Invested: ${portfolio.total_invested.toLocaleString()}
                  </p>
                </div>
                <ArrowTrendingUpIcon className="w-8 h-8 text-secondary-600" />
              </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Properties Owned</p>
                <p className="text-2xl font-bold text-gray-900">{portfolio.properties_count}</p>
                <p className="text-sm text-gray-500">
                  {portfolio.shares_owned.toLocaleString()} shares
                </p>
              </div>
              <HomeIcon className="w-8 h-8 text-primary-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Dividends</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${portfolio.monthly_dividends}
                </p>
                <p className="text-sm text-gray-500">This month</p>
              </div>
              <CurrencyDollarIcon className="w-8 h-8 text-secondary-600" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Value Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Portfolio Performance</h2>
              <div className="h-64">
                <Line 
                  data={portfolioValueData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: false,
                      },
                    },
                  }} 
                />
              </div>
            </div>

            {/* Monthly Dividends Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Dividend Income</h2>
              <div className="h-64">
                <Bar 
                  data={monthlyDividendsData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }} 
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Property Allocation */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Property Allocation</h2>
              <div className="h-48 mb-4">
                <Doughnut 
                  data={propertyAllocationData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }} 
                />
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        tx.type === 'buy' ? 'bg-primary-600' : 
                        tx.type === 'sell' ? 'bg-red-600' : 'bg-secondary-600'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {tx.type === 'buy' ? 'Bought' : tx.type === 'sell' ? 'Sold' : 'Dividend'}
                        </p>
                        <p className="text-xs text-gray-500">{tx.property_name.split(' ')[0]}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        tx.type === 'dividend' ? 'text-secondary-600' : 'text-gray-900'
                      }`}>
                        {tx.type === 'dividend' ? '+' : ''}${tx.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tx.date.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Property Holdings Table */}
        <div className="bg-white rounded-xl shadow-lg mt-8 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Property Holdings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shares
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Dividend
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {portfolio.properties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{property.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{property.shares.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${property.current_value.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Invested: ${property.invested.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ArrowUpIcon className="w-4 h-4 text-secondary-600 mr-1" />
                        <span className="text-sm font-medium text-secondary-600">
                          +${property.return_amount.toLocaleString()} ({property.return_percentage}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${property.monthly_dividend}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
=======
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary-600" />
            Recent Activity
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2"><ArrowUpIcon className="w-4 h-4 text-green-600" /> Bought 10 shares of PROP_1</li>
            <li className="flex items-center gap-2"><ArrowDownIcon className="w-4 h-4 text-red-600" /> Sold 5 shares of PROP_2</li>
          </ul>
>>>>>>> 7a1877a14c6e59aa49b0d9604f712982f3b1598f
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;