const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/digitalhomes', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Property Schema
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
  status: { 
    type: String, 
    enum: ['pending', 'tokenized', 'active', 'sold'], 
    default: 'pending' 
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const Property = mongoose.model('Property', propertySchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  property_id: String,
  user_address: String,
  transaction_type: { type: String, enum: ['buy', 'sell', 'dividend'] },
  amount: Number,
  shares: Number,
  tx_hash: String,
  timestamp: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get all properties
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await Property.find({ status: { $ne: 'pending' } });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get property by ID
app.get('/api/properties/:id', async (req, res) => {
  try {
    const property = await Property.findOne({ id: req.params.id });
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new property
app.post('/api/properties', async (req, res) => {
  try {
    const propertyData = req.body;
    
    // Generate unique ID
    propertyData.id = `PROP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get AI valuation
    const aiValuation = await getAIValuation(propertyData);
    propertyData.valuation = {
      ai_estimated_value: aiValuation.predicted_value,
      confidence_score: aiValuation.confidence_score,
      last_updated: new Date()
    };
    
    const property = new Property(propertyData);
    await property.save();
    
    res.status(201).json(property);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tokenize property
app.post('/api/properties/:id/tokenize', async (req, res) => {
  try {
    const { total_shares, share_price } = req.body;
    
    const property = await Property.findOne({ id: req.params.id });
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Simulate smart contract deployment
    const tokenizationResult = await tokenizeProperty(property, total_shares, share_price);
    
    property.tokenization = {
      deed_nft_address: tokenizationResult.deed_address,
      shares_token_address: tokenizationResult.shares_address,
      total_shares,
      share_price,
      shares_sold: 0
    };
    property.status = 'tokenized';
    property.updated_at = new Date();
    
    await property.save();
    
    res.json({
      message: 'Property tokenized successfully',
      property,
      contracts: tokenizationResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buy property shares
app.post('/api/properties/:id/buy', async (req, res) => {
  try {
    const { user_address, shares_to_buy } = req.body;
    
    const property = await Property.findOne({ id: req.params.id });
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    if (property.tokenization.shares_sold + shares_to_buy > property.tokenization.total_shares) {
      return res.status(400).json({ error: 'Not enough shares available' });
    }
    
    const total_cost = shares_to_buy * property.tokenization.share_price;
    
    // Simulate blockchain transaction
    const tx_hash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    // Update property
    property.tokenization.shares_sold += shares_to_buy;
    await property.save();
    
    // Record transaction
    const transaction = new Transaction({
      property_id: property.id,
      user_address,
      transaction_type: 'buy',
      amount: total_cost,
      shares: shares_to_buy,
      tx_hash
    });
    await transaction.save();
    
    res.json({
      message: 'Shares purchased successfully',
      transaction,
      remaining_shares: property.tokenization.total_shares - property.tokenization.shares_sold
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user transactions
app.get('/api/transactions/:address', async (req, res) => {
  try {
    const transactions = await Transaction.find({ user_address: req.params.address });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Distribute dividends
app.post('/api/properties/:id/distribute', async (req, res) => {
  try {
    const { total_amount } = req.body;
    
    const property = await Property.findOne({ id: req.params.id });
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Get all shareholders
    const buyTransactions = await Transaction.find({
      property_id: property.id,
      transaction_type: 'buy'
    });
    
    // Calculate distributions
    const distributions = {};
    buyTransactions.forEach(tx => {
      if (!distributions[tx.user_address]) {
        distributions[tx.user_address] = 0;
      }
      distributions[tx.user_address] += tx.shares;
    });
    
    const dividendTransactions = [];
    for (const [address, shares] of Object.entries(distributions)) {
      const dividend = (shares / property.tokenization.shares_sold) * total_amount;
      
      const transaction = new Transaction({
        property_id: property.id,
        user_address: address,
        transaction_type: 'dividend',
        amount: dividend,
        shares: shares,
        tx_hash: `0x${Math.random().toString(16).substr(2, 64)}`
      });
      
      await transaction.save();
      dividendTransactions.push(transaction);
    }
    
    res.json({
      message: 'Dividends distributed successfully',
      total_distributed: total_amount,
      distributions: dividendTransactions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
async function getAIValuation(propertyData) {
  try {
    const response = await axios.post('http://localhost:5001/valuate', {
      square_feet: propertyData.specifications?.square_feet || 2000,
      bedrooms: propertyData.specifications?.bedrooms || 3,
      bathrooms: propertyData.specifications?.bathrooms || 2,
      lot_size: propertyData.specifications?.lot_size || 8000,
      year_built: propertyData.specifications?.year_built || 2000,
      neighborhood_score: propertyData.location_data?.neighborhood_score || 7,
      walkability_score: propertyData.location_data?.walkability_score || 70,
      school_rating: propertyData.location_data?.school_rating || 8,
      crime_rate: propertyData.location_data?.crime_rate || 15,
      median_income: propertyData.location_data?.median_income || 65000,
      price_per_sqft_area: 150,
      days_on_market_avg: 30,
      property_tax_rate: 1.2
    });
    
    return response.data.valuation;
  } catch (error) {
    console.error('AI Valuation error:', error.message);
    // Fallback valuation
    return {
      predicted_value: 350000,
      confidence_score: 75
    };
  }
}

async function tokenizeProperty(property, totalShares, sharePrice) {
  // Simulate smart contract deployment on Andromeda
  const deedAddress = `andr1${Math.random().toString(36).substr(2, 58)}`;
  const sharesAddress = `andr1${Math.random().toString(36).substr(2, 58)}`;
  
  return {
    deed_address: deedAddress,
    shares_address: sharesAddress,
    total_shares: totalShares,
    share_price: sharePrice
  };
}

app.listen(PORT, () => {
  console.log(`Digital Homes Backend running on port ${PORT}`);
});
