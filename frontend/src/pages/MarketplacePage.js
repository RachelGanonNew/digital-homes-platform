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
<<<<<<< HEAD

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Listings</p>
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
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Trades</p>
                <p className="text-2xl font-bold text-gray-900">1,247</p>
              </div>
              <ClockIcon className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Listings</option>
                <option value="sell">Sell Orders</option>
                <option value="buy">Buy Orders</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_high">Price: High to Low</option>
                <option value="price_low">Price: Low to High</option>
                <option value="value_high">Value: High to Low</option>
                <option value="value_low">Value: Low to High</option>
              </select>
            </div>
            
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search properties..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedListings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="relative">
                <img
                  src={listing.property_image}
                  alt={listing.property_name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    listing.listing_type === 'sell' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {listing.listing_type === 'sell' ? 'Sell Order' : 'Buy Order'}
                  </span>
                </div>
                {listing.is_trending && (
                  <div className="absolute top-4 right-4 bg-secondary-100 text-secondary-800 px-2 py-1 rounded-full text-xs font-medium">
                    🔥 Trending
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {listing.property_name}
                </h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Shares</span>
                    <span className="font-semibold">{listing.shares_amount.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Price per Share</span>
                    <div className="flex items-center">
                      <span className="font-semibold text-lg">${listing.price_per_share}</span>
                      {listing.price_change && (
                        <span className={`ml-2 text-sm ${
                          listing.price_change.startsWith('+') 
                            ? 'text-secondary-600' 
                            : 'text-red-600'
                        }`}>
                          {listing.price_change}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Value</span>
                    <span className="font-bold text-primary-600">
                      ${listing.total_value.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Listed</span>
                    <span className="text-gray-500">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600">
                      {listing.listing_type === 'sell' ? 'Seller' : 'Buyer'}
                    </span>
                    <span className="text-sm font-mono text-gray-800">
                      {(listing.seller_address || listing.buyer_address).substring(0, 12)}...
                    </span>
                  </div>
                  
                  <button className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    listing.listing_type === 'sell'
                      ? 'bg-secondary-600 hover:bg-secondary-700 text-white'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}>
                    {listing.listing_type === 'sell' ? 'Buy Shares' : 'Sell to Buyer'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedListings.length === 0 && (
          <div className="text-center py-12">
            <TagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-600">Try adjusting your filters or check back later</p>
          </div>
        )}
=======
>>>>>>> 7a1877a14c6e59aa49b0d9604f712982f3b1598f
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