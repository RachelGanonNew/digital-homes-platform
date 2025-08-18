const axios = require('axios');
const WebSocket = require('ws');

class RealTimeDataService {
  constructor() {
    this.priceFeeds = new Map();
    this.subscribers = new Map();
    this.wsConnections = new Map();
    this.updateInterval = 30000; // 30 seconds
  }

  async initializePriceFeeds() {
    try {
      // Initialize real estate market data feeds
      await this.connectToMarketDataAPI();
      await this.connectToPropertyPriceIndex();
      await this.startPeriodicUpdates();
      
      console.log('✅ Real-time data feeds initialized');
    } catch (error) {
      console.error('❌ Failed to initialize data feeds:', error);
    }
  }

  async connectToMarketDataAPI() {
    try {
      // Real Estate Investment Trust (REIT) data
      const reitResponse = await axios.get('https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/2024-01-15', {
        params: {
          adjusted: true,
          apikey: process.env.POLYGON_API_KEY
        }
      });

      // Property price indices
      const hpiResponse = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
        params: {
          series_id: 'CSUSHPISA', // Case-Shiller Home Price Index
          api_key: process.env.FRED_API_KEY,
          file_type: 'json',
          limit: 12
        }
      });

      this.priceFeeds.set('reit_data', reitResponse.data);
      this.priceFeeds.set('home_price_index', hpiResponse.data);
      
      return true;
    } catch (error) {
      console.error('Market data API connection failed:', error);
      return false;
    }
  }

  async connectToPropertyPriceIndex() {
    try {
      // Zillow Home Value Index
      const zillowResponse = await axios.get('https://zillow-com1.p.rapidapi.com/propertyExtendedSearch', {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com'
        },
        params: {
          location: 'United States',
          status_type: 'RecentlySold',
          limit: 100
        }
      });

      this.priceFeeds.set('zillow_index', zillowResponse.data);
      return true;
    } catch (error) {
      console.error('Property price index connection failed:', error);
      return false;
    }
  }

  async getPropertyPriceUpdate(propertyId) {
    try {
      const property = await this.getPropertyFromDB(propertyId);
      if (!property) return null;

      // Get latest market data
      const marketData = await this.getLatestMarketData(property.location);
      
      // Calculate price adjustment based on market trends
      const priceAdjustment = this.calculatePriceAdjustment(property, marketData);
      
      // Update AI valuation with new market data
      const updatedValuation = await this.getUpdatedAIValuation(property, marketData);

      return {
        property_id: propertyId,
        previous_value: property.valuation.ai_estimated_value,
        current_value: updatedValuation.predicted_value,
        price_change: updatedValuation.predicted_value - property.valuation.ai_estimated_value,
        price_change_percent: ((updatedValuation.predicted_value - property.valuation.ai_estimated_value) / property.valuation.ai_estimated_value) * 100,
        confidence_score: updatedValuation.confidence_score,
        market_factors: marketData.factors,
        updated_at: new Date()
      };
    } catch (error) {
      console.error('Property price update failed:', error);
      throw error;
    }
  }

  async getLatestMarketData(location) {
    try {
      // Combine multiple data sources
      const [
        mortgageRates,
        localMarketTrends,
        economicIndicators,
        neighborhoodData
      ] = await Promise.all([
        this.getMortgageRates(),
        this.getLocalMarketTrends(location),
        this.getEconomicIndicators(),
        this.getNeighborhoodTrends(location)
      ]);

      return {
        mortgage_rates: mortgageRates,
        local_trends: localMarketTrends,
        economic_indicators: economicIndicators,
        neighborhood_data: neighborhoodData,
        factors: this.identifyMarketFactors(mortgageRates, localMarketTrends, economicIndicators)
      };
    } catch (error) {
      console.error('Market data retrieval failed:', error);
      throw error;
    }
  }

  async getMortgageRates() {
    try {
      const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
        params: {
          series_id: 'MORTGAGE30US', // 30-Year Fixed Rate Mortgage Average
          api_key: process.env.FRED_API_KEY,
          file_type: 'json',
          limit: 1,
          sort_order: 'desc'
        }
      });

      return {
        current_rate: parseFloat(response.data.observations[0].value),
        date: response.data.observations[0].date,
        trend: 'stable' // Calculate trend from historical data
      };
    } catch (error) {
      console.error('Mortgage rates fetch failed:', error);
      return { current_rate: 7.5, trend: 'stable' }; // Fallback
    }
  }

  async getLocalMarketTrends(location) {
    try {
      // Simulate local market analysis
      const trends = {
        price_appreciation_ytd: Math.random() * 20 - 5, // -5% to +15%
        inventory_levels: Math.random() * 5 + 1, // 1-6 months
        days_on_market: Math.random() * 60 + 15, // 15-75 days
        sale_to_list_ratio: Math.random() * 0.2 + 0.9, // 90-110%
        new_construction: Math.random() * 1000 + 100, // 100-1100 units
        population_growth: Math.random() * 4 - 1 // -1% to +3%
      };

      return trends;
    } catch (error) {
      console.error('Local market trends failed:', error);
      throw error;
    }
  }

  async getEconomicIndicators() {
    try {
      const [unemploymentRate, inflationRate, gdpGrowth] = await Promise.all([
        this.getFredData('UNRATE'), // Unemployment rate
        this.getFredData('CPIAUCSL'), // Consumer Price Index
        this.getFredData('GDP') // GDP
      ]);

      return {
        unemployment_rate: unemploymentRate,
        inflation_rate: inflationRate,
        gdp_growth: gdpGrowth,
        interest_rates: await this.getFredData('FEDFUNDS')
      };
    } catch (error) {
      console.error('Economic indicators failed:', error);
      return {
        unemployment_rate: 3.7,
        inflation_rate: 3.2,
        gdp_growth: 2.4,
        interest_rates: 5.25
      };
    }
  }

  async getFredData(seriesId) {
    try {
      const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
        params: {
          series_id: seriesId,
          api_key: process.env.FRED_API_KEY,
          file_type: 'json',
          limit: 2,
          sort_order: 'desc'
        }
      });

      const latest = parseFloat(response.data.observations[0].value);
      const previous = parseFloat(response.data.observations[1].value);
      
      return {
        current: latest,
        previous: previous,
        change: latest - previous,
        change_percent: ((latest - previous) / previous) * 100
      };
    } catch (error) {
      console.error(`FRED data fetch failed for ${seriesId}:`, error);
      return { current: 0, previous: 0, change: 0, change_percent: 0 };
    }
  }

  calculatePriceAdjustment(property, marketData) {
    let adjustment = 0;

    // Mortgage rate impact
    if (marketData.mortgage_rates.current_rate > 7) {
      adjustment -= 0.02; // -2% for high rates
    } else if (marketData.mortgage_rates.current_rate < 5) {
      adjustment += 0.02; // +2% for low rates
    }

    // Local market trends
    adjustment += marketData.local_trends.price_appreciation_ytd / 100;

    // Economic indicators
    if (marketData.economic_indicators.unemployment_rate.current > 5) {
      adjustment -= 0.01; // -1% for high unemployment
    }

    if (marketData.economic_indicators.inflation_rate.current > 4) {
      adjustment -= 0.015; // -1.5% for high inflation
    }

    return Math.max(-0.1, Math.min(0.1, adjustment)); // Cap at ±10%
  }

  identifyMarketFactors(mortgageRates, localTrends, economicIndicators) {
    const factors = [];

    if (mortgageRates.current_rate > 7) {
      factors.push({
        type: 'negative',
        factor: 'High mortgage rates reducing buyer demand',
        impact: 'medium'
      });
    }

    if (localTrends.price_appreciation_ytd > 10) {
      factors.push({
        type: 'positive',
        factor: 'Strong local price appreciation',
        impact: 'high'
      });
    }

    if (economicIndicators.unemployment_rate.current < 4) {
      factors.push({
        type: 'positive',
        factor: 'Low unemployment supporting housing demand',
        impact: 'medium'
      });
    }

    return factors;
  }

  async startPeriodicUpdates() {
    setInterval(async () => {
      try {
        await this.updateAllPropertyPrices();
        await this.broadcastPriceUpdates();
      } catch (error) {
        console.error('Periodic update failed:', error);
      }
    }, this.updateInterval);
  }

  async updateAllPropertyPrices() {
    try {
      const properties = await this.getAllActiveProperties();
      
      for (const property of properties) {
        const priceUpdate = await this.getPropertyPriceUpdate(property.id);
        if (priceUpdate) {
          await this.updatePropertyInDB(property.id, priceUpdate);
        }
      }
    } catch (error) {
      console.error('Bulk price update failed:', error);
    }
  }

  async broadcastPriceUpdates() {
    // WebSocket broadcast to connected clients
    this.wsConnections.forEach((ws, clientId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'price_update',
          timestamp: new Date(),
          data: Array.from(this.priceFeeds.entries())
        }));
      }
    });
  }

  // Helper methods (would connect to actual database)
  async getPropertyFromDB(propertyId) {
    // Database query implementation
    return null;
  }

  async getAllActiveProperties() {
    // Database query implementation
    return [];
  }

  async updatePropertyInDB(propertyId, priceUpdate) {
    // Database update implementation
    return true;
  }

  async getUpdatedAIValuation(property, marketData) {
    try {
      const response = await axios.post('http://localhost:5001/valuate', {
        ...property.specifications,
        ...property.location_data,
        market_data: marketData
      });

      return response.data.valuation;
    } catch (error) {
      console.error('AI valuation update failed:', error);
      throw error;
    }
  }
}

module.exports = RealTimeDataService;
