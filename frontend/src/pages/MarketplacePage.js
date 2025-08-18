import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
  TagIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

const MarketplacePage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchMarketplaceListings();
  }, []);

  const fetchMarketplaceListings = async () => {
    try {
      // Mock marketplace data for demonstration
      setListings([
        {
          id: 'LISTING_1',
          property_id: 'PROP_1',
          property_name: 'Luxury Beverly Hills Apartment',
          property_image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
          seller_address: 'andr1seller123...',
          shares_amount: 500,
          price_per_share: 52,
          total_value: 26000,
          listing_type: 'sell',
          created_at: new Date('2024-01-15'),
          price_change: '+4.0%',
          is_trending: true
        },
        {
          id: 'LISTING_2',
          property_id: 'PROP_2',
          property_name: 'Modern Seattle Condo',
          property_image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
          seller_address: 'andr1seller456...',
          shares_amount: 200,
          price_per_share: 35,
          total_value: 7000,
          listing_type: 'buy',
          created_at: new Date('2024-02-05'),
          price_change: '-1.2%',
          is_trending: false
        }
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching marketplace listings:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-40 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search listings..."
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Listings</option>
            <option value="buy">Buy Orders</option>
            <option value="sell">Sell Orders</option>
          </select>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            <ArrowsUpDownIcon className="w-5 h-5" />
            Sort
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Listings</p>
              <p className="text-2xl font-bold text-gray-900">{listings.length}</p>
            </div>
            <TagIcon className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">24h Volume</p>
              <p className="text-2xl font-bold text-gray-900">$127K</p>
            </div>
            <ArrowTrendingUpIcon className="w-8 h-8 text-secondary-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Price</p>
              <p className="text-2xl font-bold text-gray-900">$52.3</p>
            </div>
            <ArrowsUpDownIcon className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* ... rest of file unchanged ... */}
    </div>
  );
};

export default MarketplacePage;