const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Property = require('../models/Property');

async function initializeDatabase() {
    try {
        // Connect to MongoDB Atlas
        console.log('🔗 Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas successfully');

        // Clear existing data (for fresh demo)
        console.log('🧹 Clearing existing data...');
        await User.deleteMany({});
        await Property.deleteMany({});

        // Create demo users
        console.log('👥 Creating demo users...');
        const demoUsers = [
            {
                email: 'investor@demo.com',
                password: '$2b$10$demo.hash.for.password123',
                firstName: 'John',
                lastName: 'Investor',
                isAccredited: true,
                kycStatus: 'approved',
                walletAddress: 'andr1demo123investor456wallet789',
                portfolio: {
                    totalInvested: 50000,
                    totalValue: 52500,
                    properties: []
                }
            },
            {
                email: 'admin@digitalhomes.com',
                password: '$2b$10$demo.hash.for.admin123',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                isAccredited: true,
                kycStatus: 'approved'
            }
        ];

        await User.insertMany(demoUsers);
        console.log('✅ Demo users created');

        // Create demo properties
        console.log('🏠 Creating demo properties...');
        const demoProperties = [
            {
                title: 'Luxury Downtown Condo',
                description: 'Modern 2BR/2BA condo in prime downtown location',
                address: '123 Main St, Downtown, NY 10001',
                price: 850000,
                aiValuation: {
                    estimatedValue: 875000,
                    confidence: 0.92,
                    factors: {
                        location: 0.95,
                        condition: 0.88,
                        market: 0.94,
                        comparable: 0.91
                    },
                    lastUpdated: new Date()
                },
                tokenization: {
                    totalShares: 1000,
                    availableShares: 750,
                    pricePerShare: 850,
                    contractAddress: 'andr1demo123property456token789'
                },
                images: [
                    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
                    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
                ],
                status: 'active',
                roi: 8.5,
                location: {
                    lat: 40.7128,
                    lng: -74.0060,
                    walkScore: 95,
                    transitScore: 88
                }
            },
            {
                title: 'Suburban Family Home',
                description: 'Beautiful 4BR/3BA family home with large yard',
                address: '456 Oak Avenue, Suburbs, NY 11001',
                price: 650000,
                aiValuation: {
                    estimatedValue: 675000,
                    confidence: 0.89,
                    factors: {
                        location: 0.87,
                        condition: 0.92,
                        market: 0.85,
                        comparable: 0.93
                    },
                    lastUpdated: new Date()
                },
                tokenization: {
                    totalShares: 1000,
                    availableShares: 900,
                    pricePerShare: 650,
                    contractAddress: 'andr1demo456property789token123'
                },
                images: [
                    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
                ],
                status: 'active',
                roi: 7.2,
                location: {
                    lat: 40.6892,
                    lng: -74.0445,
                    walkScore: 72,
                    transitScore: 65
                }
            },
            {
                title: 'Investment Duplex',
                description: 'Cash-flowing duplex with long-term tenants',
                address: '789 Investment Blvd, Brooklyn, NY 11201',
                price: 1200000,
                aiValuation: {
                    estimatedValue: 1250000,
                    confidence: 0.94,
                    factors: {
                        location: 0.91,
                        condition: 0.85,
                        market: 0.96,
                        comparable: 0.95
                    },
                    lastUpdated: new Date()
                },
                tokenization: {
                    totalShares: 1000,
                    availableShares: 600,
                    pricePerShare: 1200,
                    contractAddress: 'andr1demo789property123token456'
                },
                images: [
                    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
                    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800'
                ],
                status: 'active',
                roi: 12.3,
                location: {
                    lat: 40.6782,
                    lng: -73.9442,
                    walkScore: 89,
                    transitScore: 92
                }
            }
        ];

        await Property.insertMany(demoProperties);
        console.log('✅ Demo properties created');

        // Create indexes for performance
        console.log('📊 Creating database indexes...');
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ walletAddress: 1 });
        await Property.collection.createIndex({ status: 1 });
        await Property.collection.createIndex({ 'location.lat': 1, 'location.lng': 1 });
        await Property.collection.createIndex({ price: 1 });
        await Property.collection.createIndex({ roi: -1 });

        console.log('✅ Database indexes created');
        console.log('🎉 Database initialization complete!');
        
        // Display summary
        const userCount = await User.countDocuments();
        const propertyCount = await Property.countDocuments();
        
        console.log('\n📊 Database Summary:');
        console.log(`   Users: ${userCount}`);
        console.log(`   Properties: ${propertyCount}`);
        console.log(`   Total Investment Value: $${demoProperties.reduce((sum, p) => sum + p.price, 0).toLocaleString()}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;
