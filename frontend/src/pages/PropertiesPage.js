import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  MapPinIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    priceRange: 'all',
    propertyType: 'all',
    location: 'all'
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await axios.get('/api/properties');
      setProperties(response.data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      // Mock data for demonstration
      setProperties([
        {
          id: 'PROP_1',
          address: '123 Luxury Ave, Beverly Hills, CA',
          description: 'Modern luxury apartment complex with premium amenities',
          images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'],
          specifications: {
            square_feet: 2500,
            bedrooms: 3,
            bathrooms: 2,
            property_type: 'Apartment'
          },
          tokenization: {
            total_shares: 10000,
            share_price: 50,
            shares_sold: 3500
          },
          valuation: {
            ai_estimated_value: 500000,
            confidence_score: 92
          },
          status: 'active'
        },
        {
          id: 'PROP_2',
          address: '456 Ocean View Dr, Miami, FL',
          description: 'Beachfront condo with stunning ocean views',
          images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'],
          specifications: {
            square_feet: 1800,
            bedrooms: 2,
            bathrooms: 2,
            property_type: 'Condo'
          },
          tokenization: {
            total_shares: 8000,
            share_price: 75,
            shares_sold: 6200
          },
          valuation: {
            ai_estimated_value: 600000,
            confidence_score: 88
          },
          status: 'active'
        },
        {
          id: 'PROP_3',
          address: '789 Tech Hub Blvd, Austin, TX',
          description: 'Modern office building in prime tech district',
          images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'],
          specifications: {
            square_feet: 15000,
            bedrooms: 0,
            bathrooms: 8,
            property_type: 'Commercial'
          },
          tokenization: {
            total_shares: 50000,
            share_price: 25,
            shares_sold: 12000
          },
          valuation: {
            ai_estimated_value: 1250000,
            confidence_score: 95
          },
          status: 'active'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filters.propertyType === 'all' || 
                       property.specifications.property_type.toLowerCase() === filters.propertyType;
    
    return matchesSearch && matchesType;
  });

  const getAvailabilityPercentage = (property) => {
    return ((property.tokenization.total_shares - property.tokenization.shares_sold) / property.tokenization.total_shares * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Properties</h1>
          <p className="text-gray-600">Discover AI-valued properties ready for fractional investment</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search properties by location or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div className="flex gap-4">
              <select
                value={filters.propertyType}
                onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="house">House</option>
                <option value="commercial">Commercial</option>
              </select>
              
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Link key={property.id} to={`/properties/${property.id}`}>
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="relative">
                  <img
                    src={property.images[0]}
                    alt={property.address}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-full text-sm font-medium text-primary-600">
                    {getAvailabilityPercentage(property)}% Available
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {property.specifications.property_type}
                      </h3>
                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {property.address}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">AI Confidence</div>
                      <div className="text-lg font-bold text-secondary-600">
                        {property.valuation.confidence_score}%
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {property.description}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="flex items-center">
                      <HomeIcon className="w-4 h-4 text-gray-400 mr-1" />
                      {property.specifications.square_feet.toLocaleString()} sq ft
                    </div>
                    {property.specifications.bedrooms > 0 && (
                      <div className="text-gray-600">
                        {property.specifications.bedrooms} bed
                      </div>
                    )}
                    <div className="text-gray-600">
                      {property.specifications.bathrooms} bath
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-600">Share Price</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ${property.tokenization.share_price}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <ChartBarIcon className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-600">Total Value</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ${property.valuation.ai_estimated_value.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${(property.tokenization.shares_sold / property.tokenization.total_shares) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-xs text-gray-500 text-center">
                      {property.tokenization.shares_sold.toLocaleString()} / {property.tokenization.total_shares.toLocaleString()} shares sold
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-12">
            <HomeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPage;
