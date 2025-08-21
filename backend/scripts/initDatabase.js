const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas locally to match backend/server.js and backend/middleware/auth.js
const userSchema = new mongoose.Schema({
  address: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String },
  profile: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    phoneNumber: String,
    country: String,
    address: String
  },
  kyc: {
    status: { type: String, enum: ['pending', 'submitted', 'approved', 'rejected'], default: 'pending' },
    documents: [{
      type: { type: String, enum: ['passport', 'drivers_license', 'utility_bill'] },
      url: String,
      verified: { type: Boolean, default: false },
      uploaded_at: { type: Date, default: Date.now }
    }],
    verification_level: { type: String, enum: ['basic', 'intermediate', 'advanced'], default: 'basic' },
    approved_at: Date,
    approved_by: String
  },
  wallet: {
    connected: { type: Boolean, default: false },
    balance: { type: Number, default: 0 },
    staked_amount: { type: Number, default: 0 }
  },
  portfolio: {
    total_invested: { type: Number, default: 0 },
    current_value: { type: Number, default: 0 },
    total_dividends: { type: Number, default: 0 },
    properties: [{
      property_id: String,
      shares_owned: Number,
      purchase_price: Number,
      purchase_date: Date
    }]
  },
  preferences: {
    risk_tolerance: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    investment_goals: [String],
    notification_settings: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    }
  },
  created_at: { type: Date, default: Date.now },
  last_login: Date,
  is_active: { type: Boolean, default: true }
});

const propertySchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  address: { type: String, required: true },
  description: String,
  images: [String],
  specifications: {
    square_feet: Number,
    bedrooms: Number,
    bathrooms: Number,
    lot_size: Number,
    year_built: Number,
    property_type: String
  },
  location_data: {
    neighborhood_score: Number,
    walkability_score: Number,
    school_rating: Number,
    crime_rate: Number,
    median_income: Number
  },
  tokenization: {
    deed_nft_address: String,
    shares_token_address: String,
    total_shares: Number,
    share_price: Number,
    shares_sold: { type: Number, default: 0 }
  },
  valuation: {
    ai_estimated_value: Number,
    confidence_score: Number,
    last_updated: Date
  },
  status: { type: String, enum: ['pending', 'tokenized', 'active', 'sold'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Property = mongoose.model('Property', propertySchema);

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/digitalhomes';
    console.log('🔗 Connecting to MongoDB...', uri);
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB successfully');

    // Clear existing data (for fresh demo)
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Property.deleteMany({});

    // Create demo users
    console.log('👥 Creating demo users...');
    const demoUsers = [
      {
        address: 'andr1demo123investor456wallet789',
        email: 'investor@demo.com',
        password: '$2b$10$demo.hash.for.password123',
        kyc: { status: 'approved', verification_level: 'intermediate' }
      },
      {
        address: 'andr1adm1nuserwallet000',
        email: 'admin@digitalhomes.com',
        password: '$2b$10$demo.hash.for.admin123',
        kyc: { status: 'approved', verification_level: 'advanced' }
      }
    ];
    await User.insertMany(demoUsers);
    console.log('✅ Demo users created');

    // Create demo properties matching API schema
    console.log('🏠 Creating demo properties...');
    const demoProperties = [
      {
        id: 'PROP_1',
        address: '123 Luxury Ave, Beverly Hills, CA',
        description: 'Modern luxury apartment complex with premium amenities',
        images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'],
        specifications: { square_feet: 2500, bedrooms: 3, bathrooms: 2, lot_size: 6000, year_built: 2015, property_type: 'Apartment' },
        location_data: { neighborhood_score: 9, walkability_score: 85, school_rating: 9, crime_rate: 10, median_income: 120000 },
        tokenization: { deed_nft_address: '', shares_token_address: '', total_shares: 10000, share_price: 50, shares_sold: 3500 },
        valuation: { ai_estimated_value: 500000, confidence_score: 92, last_updated: new Date() },
        status: 'active'
      },
      {
        id: 'PROP_2',
        address: '456 Ocean View Dr, Miami, FL',
        description: 'Beachfront condo with stunning ocean views',
        images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'],
        specifications: { square_feet: 1800, bedrooms: 2, bathrooms: 2, lot_size: 0, year_built: 2018, property_type: 'Condo' },
        location_data: { neighborhood_score: 8, walkability_score: 75, school_rating: 8, crime_rate: 12, median_income: 90000 },
        tokenization: { deed_nft_address: '', shares_token_address: '', total_shares: 8000, share_price: 75, shares_sold: 6200 },
        valuation: { ai_estimated_value: 600000, confidence_score: 88, last_updated: new Date() },
        status: 'active'
      },
      {
        id: 'PROP_3',
        address: '789 Tech Hub Blvd, Austin, TX',
        description: 'Modern office building in prime tech district',
        images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'],
        specifications: { square_feet: 15000, bedrooms: 0, bathrooms: 8, lot_size: 30000, year_built: 2010, property_type: 'Commercial' },
        location_data: { neighborhood_score: 8, walkability_score: 60, school_rating: 0, crime_rate: 14, median_income: 80000 },
        tokenization: { deed_nft_address: '', shares_token_address: '', total_shares: 50000, share_price: 25, shares_sold: 12000 },
        valuation: { ai_estimated_value: 1250000, confidence_score: 95, last_updated: new Date() },
        status: 'active'
      }
    ];
    await Property.insertMany(demoProperties);
    console.log('✅ Demo properties created');

    // Indexes
    await Property.collection.createIndex({ status: 1 });
    await User.collection.createIndex({ email: 1 }, { unique: true });

    console.log('🎉 Database initialization complete!');
    const userCount = await User.countDocuments();
    const propertyCount = await Property.countDocuments();
    console.log(`📊 Users: ${userCount} | Properties: ${propertyCount}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
