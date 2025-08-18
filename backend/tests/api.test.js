const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Digital Homes API Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect('mongodb://localhost:27017/digitalhomes_test');
  });

  afterAll(async () => {
    // Clean up test database
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('Health Check', () => {
    test('GET /api/health should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Properties API', () => {
    test('POST /api/properties should create new property', async () => {
      const propertyData = {
        address: '123 Test St, Test City, TC 12345',
        description: 'Test property for automated testing',
        specifications: {
          square_feet: 2000,
          bedrooms: 3,
          bathrooms: 2,
          lot_size: 8000,
          year_built: 2020,
          property_type: 'House'
        },
        location_data: {
          neighborhood_score: 8,
          walkability_score: 75,
          school_rating: 9,
          crime_rate: 12,
          median_income: 75000
        }
      };

      const response = await request(app)
        .post('/api/properties')
        .send(propertyData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.address).toBe(propertyData.address);
      expect(response.body.valuation.ai_estimated_value).toBeDefined();
    });

    test('GET /api/properties should return all properties', async () => {
      const response = await request(app)
        .get('/api/properties')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('AI Valuation', () => {
    test('Property valuation should return valid prediction', async () => {
      const testProperty = {
        square_feet: 2500,
        bedrooms: 4,
        bathrooms: 3,
        lot_size: 10000,
        year_built: 2015,
        neighborhood_score: 8.5,
        walkability_score: 80,
        school_rating: 9,
        crime_rate: 8,
        median_income: 85000,
        price_per_sqft_area: 200,
        days_on_market_avg: 25,
        property_tax_rate: 1.5
      };

      const response = await request('http://localhost:5001')
        .post('/valuate')
        .send(testProperty)
        .expect(200);

      expect(response.body.valuation.predicted_value).toBeGreaterThan(0);
      expect(response.body.valuation.confidence_score).toBeGreaterThan(0);
      expect(response.body.valuation.confidence_score).toBeLessThanOrEqual(100);
    });
  });

  describe('Investment Flow', () => {
    let propertyId;

    beforeEach(async () => {
      // Create test property
      const propertyData = {
        address: '456 Investment Ave, Test City, TC 12345',
        specifications: {
          square_feet: 1800,
          bedrooms: 2,
          bathrooms: 2,
          property_type: 'Condo'
        }
      };

      const response = await request(app)
        .post('/api/properties')
        .send(propertyData);

      propertyId = response.body.id;

      // Tokenize property
      await request(app)
        .post(`/api/properties/${propertyId}/tokenize`)
        .send({
          total_shares: 1000,
          share_price: 100
        });
    });

    test('Should allow share purchase', async () => {
      const purchaseData = {
        user_address: 'andr1testuser123',
        shares_to_buy: 10
      };

      const response = await request(app)
        .post(`/api/properties/${propertyId}/buy`)
        .send(purchaseData)
        .expect(200);

      expect(response.body.transaction.shares).toBe(10);
      expect(response.body.transaction.amount).toBe(1000);
    });

    test('Should distribute dividends correctly', async () => {
      // First, buy some shares
      await request(app)
        .post(`/api/properties/${propertyId}/buy`)
        .send({
          user_address: 'andr1testuser123',
          shares_to_buy: 100
        });

      // Then distribute dividends
      const response = await request(app)
        .post(`/api/properties/${propertyId}/distribute`)
        .send({
          total_amount: 1000
        })
        .expect(200);

      expect(response.body.total_distributed).toBe(1000);
      expect(response.body.distributions.length).toBeGreaterThan(0);
    });
  });

  describe('Authentication', () => {
    test('Should register new user', async () => {
      const userData = {
        address: 'andr1testuser456',
        email: 'test@example.com',
        password: 'securepassword123',
        profile: {
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          country: 'US'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.token).toBeDefined();
      expect(response.body.user.address).toBe(userData.address);
    });

    test('Should login existing user', async () => {
      // First register
      await request(app)
        .post('/api/auth/register')
        .send({
          address: 'andr1testuser789',
          email: 'login@example.com',
          password: 'password123',
          profile: { firstName: 'Login', lastName: 'Test' }
        });

      // Then login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('login@example.com');
    });
  });

  describe('Error Handling', () => {
    test('Should handle invalid property ID', async () => {
      const response = await request(app)
        .get('/api/properties/INVALID_ID')
        .expect(404);

      expect(response.body.error).toBe('Property not found');
    });

    test('Should handle insufficient shares', async () => {
      // Create property with limited shares
      const propertyResponse = await request(app)
        .post('/api/properties')
        .send({
          address: 'Limited Shares Property',
          specifications: { square_feet: 1000, bedrooms: 1, bathrooms: 1 }
        });

      const propertyId = propertyResponse.body.id;

      await request(app)
        .post(`/api/properties/${propertyId}/tokenize`)
        .send({
          total_shares: 10,
          share_price: 100
        });

      // Try to buy more shares than available
      const response = await request(app)
        .post(`/api/properties/${propertyId}/buy`)
        .send({
          user_address: 'andr1testuser999',
          shares_to_buy: 20
        })
        .expect(400);

      expect(response.body.error).toBe('Not enough shares available');
    });
  });
});
