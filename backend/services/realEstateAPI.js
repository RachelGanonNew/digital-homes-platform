const axios = require('axios');

class RealEstateDataService {
  constructor() {
    this.rapidApiKey = process.env.RAPIDAPI_KEY;
    this.rentalsApiKey = process.env.RENTALS_API_KEY;
    this.mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  }

  async getPropertyData(address) {
    try {
      // RentSpree API for property details
      const propertyResponse = await axios.get('https://rentspree-rentals.p.rapidapi.com/properties/list', {
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'rentspree-rentals.p.rapidapi.com'
        },
        params: {
          location: address,
          limit: 1
        }
      });

      // Zillow API for market data
      const marketResponse = await axios.get('https://zillow-com1.p.rapidapi.com/propertyExtendedSearch', {
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com'
        },
        params: {
          location: address,
          status_type: 'ForSale'
        }
      });

      return this.normalizePropertyData(propertyResponse.data, marketResponse.data);
    } catch (error) {
      console.error('Real estate API error:', error);
      throw new Error('Failed to fetch property data');
    }
  }

  async getNeighborhoodData(latitude, longitude) {
    try {
      // Walk Score API
      const walkScoreResponse = await axios.get(`https://api.walkscore.com/score`, {
        params: {
          format: 'json',
          address: `${latitude},${longitude}`,
          lat: latitude,
          lon: longitude,
          transit: 1,
          bike: 1,
          wsapikey: process.env.WALKSCORE_API_KEY
        }
      });

      // Crime data API
      const crimeResponse = await axios.get('https://api.usa.gov/crime/fbi/sapi/api/estimates/states', {
        headers: {
          'X-API-Key': process.env.FBI_API_KEY
        }
      });

      // School ratings API
      const schoolResponse = await axios.get('https://api.greatschools.org/schools/nearby', {
        headers: {
          'X-API-Key': process.env.GREATSCHOOLS_API_KEY
        },
        params: {
          lat: latitude,
          lon: longitude,
          radius: 5
        }
      });

      return {
        walkability_score: walkScoreResponse.data.walkscore,
        transit_score: walkScoreResponse.data.transit?.score || 0,
        bike_score: walkScoreResponse.data.bike?.score || 0,
        crime_rate: this.calculateCrimeRate(crimeResponse.data),
        school_rating: this.calculateSchoolRating(schoolResponse.data),
        neighborhood_score: this.calculateNeighborhoodScore({
          walkability: walkScoreResponse.data.walkscore,
          schools: schoolResponse.data,
          crime: crimeResponse.data
        })
      };
    } catch (error) {
      console.error('Neighborhood data error:', error);
      return this.getDefaultNeighborhoodData();
    }
  }

  async getMarketComparables(address, propertyType, sqft) {
    try {
      const response = await axios.get('https://zillow-com1.p.rapidapi.com/propertyExtendedSearch', {
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com'
        },
        params: {
          location: address,
          status_type: 'RecentlySold',
          home_type: propertyType,
          sqft_min: sqft * 0.8,
          sqft_max: sqft * 1.2,
          limit: 10
        }
      });

      return response.data.props?.map(prop => ({
        address: prop.address,
        price: prop.price,
        square_feet: prop.livingArea,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        sold_date: prop.dateSold,
        price_per_sqft: prop.price / prop.livingArea
      })) || [];
    } catch (error) {
      console.error('Comparables API error:', error);
      return [];
    }
  }

  normalizePropertyData(propertyData, marketData) {
    const property = propertyData.properties?.[0] || {};
    
    return {
      address: property.address,
      square_feet: property.sqft,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      lot_size: property.lotSize,
      year_built: property.yearBuilt,
      property_type: property.propertyType,
      listing_price: property.price,
      images: property.photos?.map(photo => photo.href) || [],
      description: property.description,
      mls_number: property.mlsid,
      days_on_market: property.daysOnMarket,
      price_per_sqft: property.price / property.sqft
    };
  }

  calculateCrimeRate(crimeData) {
    // Calculate crime rate per 100k population
    const totalCrimes = crimeData.reduce((sum, state) => sum + (state.violent_crime + state.property_crime), 0);
    const totalPopulation = crimeData.reduce((sum, state) => sum + state.population, 0);
    return (totalCrimes / totalPopulation) * 100000;
  }

  calculateSchoolRating(schoolData) {
    if (!schoolData.schools || schoolData.schools.length === 0) return 5;
    
    const avgRating = schoolData.schools.reduce((sum, school) => sum + (school.rating || 5), 0) / schoolData.schools.length;
    return Math.min(10, avgRating);
  }

  calculateNeighborhoodScore(data) {
    const walkScore = (data.walkability || 50) / 10;
    const schoolScore = data.schools?.rating || 5;
    const crimeScore = Math.max(0, 10 - (data.crime || 20) / 5);
    
    return (walkScore + schoolScore + crimeScore) / 3;
  }

  getDefaultNeighborhoodData() {
    return {
      walkability_score: 65,
      transit_score: 45,
      bike_score: 55,
      crime_rate: 15,
      school_rating: 7.5,
      neighborhood_score: 7.2
    };
  }
}

module.exports = RealEstateDataService;
