const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const IN_MEMORY = !process.env.MONGODB_URI; // Match server.js behavior

// User model (Mongo-backed or in-memory fallback)
let User;
if (!IN_MEMORY) {
  // Mongoose schema/model
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
      status: { 
        type: String, 
        enum: ['pending', 'submitted', 'approved', 'rejected'], 
        default: 'pending' 
      },
      documents: [{
        type: { type: String, enum: ['passport', 'drivers_license', 'utility_bill'] },
        url: String,
        verified: { type: Boolean, default: false },
        uploaded_at: { type: Date, default: Date.now }
      }],
      verification_level: { 
        type: String, 
        enum: ['basic', 'intermediate', 'advanced'], 
        default: 'basic' 
      },
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

  User = mongoose.model('User', userSchema);
} else {
  // In-memory fallback implementation
  const mem = { users: [] };
  class UserMem {
    constructor(data) {
      // defaults similar to schema
      this.address = data.address;
      this.email = data.email;
      this.password = data.password;
      this.profile = data.profile || {};
      this.kyc = data.kyc || {
        status: 'pending',
        documents: [],
        verification_level: 'basic'
      };
      this.wallet = data.wallet || { connected: false, balance: 0, staked_amount: 0 };
      this.portfolio = data.portfolio || { total_invested: 0, current_value: 0, total_dividends: 0, properties: [] };
      this.preferences = data.preferences || {
        risk_tolerance: 'medium',
        investment_goals: [],
        notification_settings: { email: true, sms: false, push: true }
      };
      this.created_at = data.created_at || new Date();
      this.last_login = data.last_login;
      this.is_active = data.is_active ?? true;
    }
    async save() {
      const idx = mem.users.findIndex(u => u.address === this.address || u.email === this.email);
      if (idx >= 0) mem.users[idx] = this; else mem.users.push(this);
    }
    static async findOne(query) {
      if (!query) return null;
      if (query.$or && Array.isArray(query.$or)) {
        const [{ address }, { email }] = query.$or;
        return mem.users.find(u => (address && u.address === address) || (email && u.email === email)) || null;
      }
      if (query.email) return mem.users.find(u => u.email === query.email) || null;
      if (query.address) return mem.users.find(u => u.address === query.address) || null;
      return null;
    }
  }
  User = UserMem;
}

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// KYC Verification Middleware
const requireKYC = (level = 'basic') => {
  return async (req, res, next) => {
    try {
      const user = await User.findOne({ address: req.user.address });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const kycLevels = ['basic', 'intermediate', 'advanced'];
      const requiredLevelIndex = kycLevels.indexOf(level);
      const userLevelIndex = kycLevels.indexOf(user.kyc.verification_level);

      if (user.kyc.status !== 'approved' || userLevelIndex < requiredLevelIndex) {
        return res.status(403).json({ 
          error: 'KYC verification required',
          required_level: level,
          current_level: user.kyc.verification_level,
          kyc_status: user.kyc.status
        });
      }

      req.user.kyc_level = user.kyc.verification_level;
      next();
    } catch (error) {
      res.status(500).json({ error: 'KYC verification failed' });
    }
  };
};

// Investment Limits Middleware
const checkInvestmentLimits = async (req, res, next) => {
  try {
    const user = await User.findOne({ address: req.user.address });
    const { shares_to_buy, share_price } = req.body;
    const investment_amount = shares_to_buy * share_price;

    // KYC-based investment limits
    const limits = {
      basic: 10000,      // $10K per transaction
      intermediate: 50000, // $50K per transaction
      advanced: 1000000   // $1M per transaction
    };

    const userLimit = limits[user.kyc.verification_level];
    
    if (investment_amount > userLimit) {
      return res.status(403).json({
        error: 'Investment amount exceeds KYC limit',
        limit: userLimit,
        requested: investment_amount,
        kyc_level: user.kyc.verification_level
      });
    }

    // Daily investment limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayInvestments = await Transaction.aggregate([
      {
        $match: {
          user_address: user.address,
          transaction_type: 'buy',
          timestamp: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const dailyTotal = todayInvestments[0]?.total || 0;
    const dailyLimit = userLimit * 2; // 2x transaction limit for daily

    if (dailyTotal + investment_amount > dailyLimit) {
      return res.status(403).json({
        error: 'Daily investment limit exceeded',
        daily_limit: dailyLimit,
        today_total: dailyTotal,
        requested: investment_amount
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Investment limit check failed' });
  }
};

// Anti-Money Laundering (AML) Checks
const amlCheck = async (req, res, next) => {
  try {
    const { user_address, amount } = req.body;
    
    // Large transaction reporting threshold
    if (amount > 10000) {
      // Log for regulatory reporting
      console.log(`Large transaction detected: ${user_address} - $${amount}`);
      
      // In production, integrate with AML service
      const amlResult = await performAMLCheck(user_address, amount);
      
      if (amlResult.risk_level === 'high') {
        return res.status(403).json({
          error: 'Transaction flagged for review',
          reference: amlResult.reference_id
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'AML check failed' });
  }
};

async function performAMLCheck(address, amount) {
  // Simulate AML service integration
  // In production, integrate with services like Chainalysis, Elliptic
  return {
    risk_level: Math.random() > 0.95 ? 'high' : 'low',
    reference_id: `AML_${Date.now()}`,
    checked_at: new Date()
  };
}

module.exports = {
  User,
  authenticateToken,
  requireKYC,
  checkInvestmentLimits,
  amlCheck
};
