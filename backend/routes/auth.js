const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { User, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/kyc/');
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.address}_${file.fieldname}_${Date.now()}.${file.originalname.split('.').pop()}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF allowed.'));
    }
  }
});

// Register user
router.post('/register', async (req, res) => {
  try {
    const { address, email, password, profile } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ address }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      address,
      email,
      password: hashedPassword,
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        dateOfBirth: new Date(profile.dateOfBirth),
        phoneNumber: profile.phoneNumber,
        country: profile.country,
        address: profile.address
      }
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { address: user.address, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        address: user.address,
        email: user.email,
        kyc_status: user.kyc.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { address: user.address, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        address: user.address,
        email: user.email,
        kyc_status: user.kyc.status,
        verification_level: user.kyc.verification_level
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ address: req.user.address }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { profile, preferences } = req.body;

    const user = await User.findOne({ address: req.user.address });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }

    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit KYC documents
router.post('/kyc/submit', authenticateToken, upload.fields([
  { name: 'passport', maxCount: 1 },
  { name: 'drivers_license', maxCount: 1 },
  { name: 'utility_bill', maxCount: 1 }
]), async (req, res) => {
  try {
    const user = await User.findOne({ address: req.user.address });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Process uploaded documents
    const documents = [];
    if (req.files) {
      Object.keys(req.files).forEach(fieldname => {
        const file = req.files[fieldname][0];
        documents.push({
          type: fieldname,
          url: file.path,
          verified: false,
          uploaded_at: new Date()
        });
      });
    }

    user.kyc.documents = documents;
    user.kyc.status = 'submitted';
    await user.save();

    // Auto-approve for demo (in production, manual review required)
    setTimeout(async () => {
      user.kyc.status = 'approved';
      user.kyc.verification_level = 'intermediate';
      user.kyc.approved_at = new Date();
      user.kyc.approved_by = 'system_auto_approval';
      await user.save();
    }, 5000);

    res.json({
      message: 'KYC documents submitted successfully',
      status: user.kyc.status,
      documents: documents.map(doc => ({ type: doc.type, uploaded_at: doc.uploaded_at }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get KYC status
router.get('/kyc/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ address: req.user.address });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      status: user.kyc.status,
      verification_level: user.kyc.verification_level,
      documents: user.kyc.documents.map(doc => ({
        type: doc.type,
        verified: doc.verified,
        uploaded_at: doc.uploaded_at
      })),
      approved_at: user.kyc.approved_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Wallet connection endpoint
router.post('/connect-wallet', async (req, res) => {
  try {
    const { address, signature } = req.body;

    // Verify wallet signature (simplified for demo)
    const message = `Connect wallet to Digital Homes: ${Date.now()}`;
    
    // In production, verify the signature against the message
    const isValidSignature = true; // Simplified for demo

    if (!isValidSignature) {
      return res.status(401).json({ error: 'Invalid wallet signature' });
    }

    // Find or create user
    let user = await User.findOne({ address });
    if (!user) {
      user = new User({
        address,
        email: `${address}@wallet.local`, // Temporary email
        wallet: {
          connected: true,
          balance: 0
        }
      });
      await user.save();
    } else {
      user.wallet.connected = true;
      user.last_login = new Date();
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { address: user.address, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Wallet connected successfully',
      token,
      user: {
        address: user.address,
        kyc_status: user.kyc.status,
        verification_level: user.kyc.verification_level,
        wallet_connected: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
