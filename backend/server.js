const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const IN_MEMORY = !process.env.MONGODB_URI; // Run without MongoDB if no URI provided

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection (skip if IN_MEMORY)
// Avoid connecting automatically during tests; the test suite manages the connection lifecycle.
if (process.env.NODE_ENV !== 'test' && !IN_MEMORY) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/digitalhomes', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err.message));
} else if (IN_MEMORY) {
  console.log('Running backend in IN-MEMORY mode (no MongoDB)');
}

// Build a monthly series from transactions for the last `months` months.
// Options: cumulative true => cumulative sum across months, else per-month sum.
function buildMonthlySeries(transactions, months, { cumulative }) {
  const now = new Date();
  const buckets = [];
  const labels = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    buckets.push({ key, year: d.getFullYear(), month: d.getMonth(), sum: 0 });
    labels.push(d.toLocaleString('en-US', { month: 'short' }));
  }

  // Sum amounts into buckets
  transactions.forEach((tx) => {
    const t = tx.timestamp ? new Date(tx.timestamp) : new Date();
    const key = `${t.getFullYear()}-${(t.getMonth() + 1).toString().padStart(2, '0')}`;
    const bucket = buckets.find(b => b.key === key);
    if (bucket) bucket.sum += Number(tx.amount || 0);
  });

  const series = [];
  let running = 0;
  for (const b of buckets) {
    running = cumulative ? running + b.sum : b.sum;
    series.push(Number(running.toFixed(2)));
  }

  return { labels, series };
}

// Models: Mongo-backed or in-memory fallback
let Property;
let Transaction;

if (!IN_MEMORY) {
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

  Property = mongoose.model('Property', propertySchema);

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

  Transaction = mongoose.model('Transaction', transactionSchema);
} else {
  // In-memory fallback implementations
  const mem = {
    properties: [],
    transactions: [],
  };

  class PropertyMem {
    constructor(data) {
      Object.assign(this, data);
      this.created_at = this.created_at || new Date();
      this.updated_at = new Date();
    }
    async save() {
      const idx = mem.properties.findIndex((p) => p.id === this.id);
      this.updated_at = new Date();
      if (idx >= 0) mem.properties[idx] = this;
      else mem.properties.push(this);
    }
    static async find(query) {
      // Only used with { status: { $ne: 'pending' } }
      if (query && query.status && query.status.$ne !== undefined) {
        return mem.properties.filter((p) => p.status !== query.status.$ne);
      }
      return [...mem.properties];
    }
    static async findOne(query) {
      if (query && query.id) return mem.properties.find((p) => p.id === query.id) || null;
      return null;
    }
  }

  class TransactionMem {
    constructor(data) { Object.assign(this, data); this.timestamp = this.timestamp || new Date(); }
    async save() { mem.transactions.push(this); }
    static async find(query) {
      if (query && query.user_address) return mem.transactions.filter((t) => t.user_address === query.user_address);
      if (query && query.property_id) return mem.transactions.filter((t) => t.property_id === query.property_id);
      return [...mem.transactions];
    }
  }

  Property = PropertyMem;
  Transaction = TransactionMem;
}

// Routes
const authRoutes = require('./routes/auth');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), in_memory: IN_MEMORY });
});

// Auth routes
app.use('/api/auth', authRoutes);

// RPC proxy to bypass browser CORS when connecting to Andromeda Tendermint RPC
// Usage from frontend: set RPC URL to http://localhost:5000/api/rpc
const RPC_TARGET = process.env.ANDROMEDA_RPC_URL || 'https://rpc.andromeda-1.andromeda.io:443';
app.use('/api/rpc', async (req, res) => {
  try {
    const url = `${RPC_TARGET}${req.url}`;
    const headers = { ...req.headers };
    // Remove hop-by-hop and browser-specific headers that can break proxying
    delete headers['host'];
    delete headers['origin'];
    delete headers['referer'];
    delete headers['content-length'];

    const response = await axios({
      method: req.method,
      url,
      headers,
      params: req.query,
      data: Object.keys(req.body || {}).length ? req.body : undefined,
      timeout: 15000,
      validateStatus: () => true,
    });

    res.status(response.status);
    // Forward JSON or text transparently
    if (typeof response.data === 'object') {
      res.json(response.data);
    } else {
      res.send(response.data);
    }
  } catch (err) {
    console.error('RPC proxy error:', err.message);
    res.status(502).json({ error: 'RPC proxy failed', message: err.message });
  }
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

// Portfolio analytics: timeseries of invested value (sum of buys) for last N months
app.get('/api/portfolio/timeseries', async (req, res) => {
  try {
    const address = req.query.address; // optional
    const months = Math.max(1, Math.min(24, parseInt(req.query.months || '12', 10)));

    // Fetch relevant buy transactions
    const query = { transaction_type: 'buy' };
    if (address) query.user_address = address;
    const buys = await Transaction.find(query);

    const { labels, series } = buildMonthlySeries(buys, months, { cumulative: true });
    res.json({ labels, data: series });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Portfolio analytics: monthly dividends for last N months
app.get('/api/portfolio/dividends', async (req, res) => {
  try {
    const address = req.query.address; // optional
    const months = Math.max(1, Math.min(24, parseInt(req.query.months || '6', 10)));

    const query = { transaction_type: 'dividend' };
    if (address) query.user_address = address;
    const dividends = await Transaction.find(query);

    const { labels, series } = buildMonthlySeries(dividends, months, { cumulative: false });
    res.json({ labels, data: series });
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

// Only start the HTTP server when not running tests
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`Digital Homes Backend running on port ${PORT}`);
  });
}

module.exports = app;
