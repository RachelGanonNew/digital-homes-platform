import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  MapPinIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CalendarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchaseAmount, setPurchaseAmount] = useState(1);
  const [userAddress] = useState('andr1user123...'); // Mock user address

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/properties/${id}`);
      setProperty(response.data);
    } catch (error) {
      console.error('Error fetching property:', error);
      // Mock data for demonstration
      setProperty({
        id: 'PROP_1',
        address: '123 Luxury Ave, Beverly Hills, CA 90210',
        description: 'Stunning modern luxury apartment complex featuring premium amenities, rooftop pool, fitness center, and concierge services. Located in the heart of Beverly Hills with easy access to shopping, dining, and entertainment.',
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
        ],
        specifications: {
          square_feet: 2500,
          bedrooms: 3,
          bathrooms: 2,
          lot_size: 5000,
          year_built: 2020,
          property_type: 'Luxury Apartment'
        },
        location_data: {
          neighborhood_score: 9.2,
          walkability_score: 88,
          school_rating: 9.5,
          crime_rate: 2.1,
          median_income: 125000
        },
        tokenization: {
          deed_nft_address: 'andr1deed123...',
          shares_token_address: 'andr1shares123...',
          total_shares: 10000,
          share_price: 50,
          shares_sold: 3500
        },
        valuation: {
          ai_estimated_value: 500000,
          confidence_score: 92,
          last_updated: new Date('2024-01-15')
        },
        status: 'active'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    try {
      const response = await axios.post(`http://localhost:5000/api/properties/${id}/buy`, {
        user_address: userAddress,
        shares_to_buy: purchaseAmount
      });
      
      toast.success(`Successfully purchased ${purchaseAmount} shares!`);
      fetchProperty(); // Refresh property data
    } catch (error) {
      toast.error('Purchase failed. Please try again.');
      console.error('Purchase error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600">The property you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const availableShares = property.tokenization.total_shares - property.tokenization.shares_sold;
  const soldPercentage = (property.tokenization.shares_sold / property.tokenization.total_shares) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Image Gallery */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="grid md:grid-cols-3 gap-2">
            <div className="md:col-span-2">
              <img
                src={property.images[0]}
                alt="Main property view"
                className="w-full h-96 object-cover"
              />
            </div>
            <div className="grid grid-rows-2 gap-2">
              {property.images.slice(1, 3).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Property view ${index + 2}`}
                  className="w-full h-47 object-cover"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {property.specifications.property_type}
                  </h1>
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="w-5 h-5 mr-2" />
                    {property.address}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center mb-1">
                    <SparklesIcon className="w-5 h-5 text-primary-600 mr-1" />
                    <span className="text-sm text-gray-600">AI Confidence</span>
                  </div>
                  <div className="text-2xl font-bold text-secondary-600">
                    {property.valuation.confidence_score}%
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-6">{property.description}</p>

              {/* Property Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <HomeIcon className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                  <div className="text-lg font-semibold">{property.specifications.square_feet.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Sq Ft</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold">{property.specifications.bedrooms}</div>
                  <div className="text-sm text-gray-600">Bedrooms</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold">{property.specifications.bathrooms}</div>
                  <div className="text-sm text-gray-600">Bathrooms</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                  <div className="text-lg font-semibold">{property.specifications.year_built}</div>
                  <div className="text-sm text-gray-600">Built</div>
                </div>
              </div>
            </div>

            {/* AI Valuation Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <SparklesIcon className="w-6 h-6 text-primary-600 mr-2" />
                AI Valuation Analysis
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Property Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Value</span>
                      <span className="font-semibold">${property.valuation.ai_estimated_value.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Neighborhood Score</span>
                      <span className="font-semibold">{property.location_data.neighborhood_score}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Walkability</span>
                      <span className="font-semibold">{property.location_data.walkability_score}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">School Rating</span>
                      <span className="font-semibold">{property.location_data.school_rating}/10</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Investment Potential</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Crime Rate</span>
                      <span className="font-semibold text-secondary-600">{property.location_data.crime_rate}% (Low)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Median Income</span>
                      <span className="font-semibold">${property.location_data.median_income.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected ROI</span>
                      <span className="font-semibold text-secondary-600">8.2% annually</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Level</span>
                      <span className="font-semibold text-secondary-600">Low</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tokenization Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <ShieldCheckIcon className="w-6 h-6 text-primary-600 mr-2" />
                Tokenization Details
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deed NFT</span>
                      <span className="font-mono text-sm">{property.tokenization.deed_nft_address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shares Contract</span>
                      <span className="font-mono text-sm">{property.tokenization.shares_token_address}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Shares</span>
                      <span className="font-semibold">{property.tokenization.total_shares.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shares Sold</span>
                      <span className="font-semibold">{property.tokenization.shares_sold.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Purchase Shares</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Share Price</span>
                    <span className="text-2xl font-bold text-primary-600">
                      ${property.tokenization.share_price}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">Per share</div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Available</span>
                    <span className="font-semibold text-secondary-600">
                      {availableShares.toLocaleString()} shares
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div 
                      className="bg-primary-600 h-3 rounded-full" 
                      style={{ width: `${soldPercentage}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {soldPercentage.toFixed(1)}% sold
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Shares
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={availableShares}
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(parseInt(e.target.value) || 1)}
                    className="input-field"
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total Cost</span>
                    <span className="text-2xl font-bold text-primary-600">
                      ${(purchaseAmount * property.tokenization.share_price).toLocaleString()}
                    </span>
                  </div>
                  
                  <button
                    onClick={handlePurchase}
                    disabled={purchaseAmount > availableShares}
                    className="btn-primary w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Purchase Shares
                  </button>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  Powered by Andromeda Protocol smart contracts
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;
