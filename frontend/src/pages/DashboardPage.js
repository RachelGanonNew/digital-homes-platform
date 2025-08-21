import React, { useEffect, useState } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  HomeIcon,
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

const DashboardPage = () => {
  const [tsLabels, setTsLabels] = useState([]);
  const [tsData, setTsData] = useState([]);
  const [divLabels, setDivLabels] = useState([]);
  const [divData, setDivData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [tsRes, divRes] = await Promise.all([
          axios.get('/api/portfolio/timeseries?months=12'),
          axios.get('/api/portfolio/dividends?months=6')
        ]);
        if (!mounted) return;
        setTsLabels(tsRes.data.labels || []);
        setTsData(tsRes.data.data || []);
        setDivLabels(divRes.data.labels || []);
        setDivData(divRes.data.data || []);
      } catch (e) {
        // Fallback to mock data if backend not available yet
        setTsLabels(['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug']);
        setTsData([98500,100200,102000,104500,105200,108300,112000,117500,120000,121400,123200,125430]);
        setDivLabels(['Mar','Apr','May','Jun','Jul','Aug']);
        setDivData([120,140,135,150,160,155]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

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
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Portfolio Value (Last 12 Months)</p>
                <span className="text-xs text-gray-500">Mock data</span>
              </div>
              <div className="h-64">
              <Line
                data={{
                  labels: tsLabels,
                  datasets: [
                    {
                      label: 'Value ($)',
                      data: tsData,
                      borderColor: 'rgba(59,130,246,1)',
                      backgroundColor: 'rgba(59,130,246,0.15)',
                      fill: true,
                      tension: 0.35,
                      pointRadius: 2
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                  scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: '#f1f5f9' }, ticks: { callback: (v) => `$${v.toLocaleString()}` } }
                  }
                }}
              />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Monthly Dividends</p>
                <span className="text-xs text-gray-500">Mock data</span>
              </div>
              <div className="h-56">
              <Bar
                data={{
                  labels: divLabels,
                  datasets: [
                    {
                      label: 'Dividends ($)',
                      data: divData,
                      backgroundColor: 'rgba(16,185,129,0.6)',
                      borderColor: 'rgba(16,185,129,1)'
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                  scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: '#f1f5f9' } }
                  }
                }}
              />
              </div>
            </div>
          </div>
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