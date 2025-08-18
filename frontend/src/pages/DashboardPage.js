import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  HomeIcon,
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const DashboardPage = () => {
  const [userAddress] = useState('andr1user123...'); // Mock user address
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Mock user portfolio data
      setPortfolio({
        total_value: 45750,
        total_invested: 42000,
        total_return: 3750,
        return_percentage: 8.93,
        properties_count: 3,
        shares_owned: 1250,
        monthly_dividends: 287.50,
        properties: [
          {
            id: 'PROP_1',
            name: 'Beverly Hills Luxury Apartment',
            shares: 500,
            current_value: 26000,
            invested: 25000,
            return_amount: 1000,
            return_percentage: 4.0,
            monthly_dividend: 125.50
          },
          {
            id: 'PROP_2',
            name: 'Miami Beachfront Condo',
            shares: 250,
            current_value: 19500,
            invested: 18750,
            return_amount: 750,
            return_percentage: 4.0,
            monthly_dividend: 89.25
          },
          {
            id: 'PROP_3',
            name: 'Austin Tech Hub Office',
            shares: 500,
            current_value: 13500,
            invested: 12500,
            return_amount: 1000,
            return_percentage: 8.0,
            monthly_dividend: 72.75
          }
        ]
      });

      setTransactions([
        {
          id: 'TX_1',
          property_name: 'Beverly Hills Luxury Apartment',
          type: 'buy',
          shares: 500,
          amount: 25000,
          date: new Date('2024-01-10'),
          tx_hash: '0xabc123...'
        },
        {
          id: 'TX_2',
          property_name: 'Miami Beachfront Condo',
          type: 'buy',
          shares: 250,
          amount: 18750,
          date: new Date('2024-01-08'),
          tx_hash: '0xdef456...'
        },
        {
          id: 'TX_3',
          property_name: 'Austin Tech Hub Office',
          type: 'buy',
          shares: 500,
          amount: 12500,
          date: new Date('2024-01-05'),
          tx_hash: '0xghi789...'
        },
        {
          id: 'TX_4',
          property_name: 'Beverly Hills Luxury Apartment',
          type: 'dividend',
          shares: 500,
          amount: 125.50,
          date: new Date('2024-01-15'),
          tx_hash: '0xjkl012...'
        }
      ]);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data
  const portfolioValueData = {
    labels: ['Jan 1', 'Jan 5', 'Jan 10', 'Jan 15', 'Jan 20'],
    datasets: [
      {
        label: 'Portfolio Value',
        data: [42000, 42500, 43200, 44100, 45750],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const propertyAllocationData = {
    labels: portfolio?.properties.map(p => p.name.split(' ')[0]) || [],
    datasets: [
      {
        data: portfolio?.properties.map(p => p.current_value) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const monthlyDividendsData = {
    labels: ['Oct', 'Nov', 'Dec', 'Jan'],
    datasets: [
      {
        label: 'Monthly Dividends',
        data: [245, 267, 278, 287.50],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Dashboard</h1>
          <p className="text-gray-600">Track your real estate portfolio performance</p>
        </div>

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
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
