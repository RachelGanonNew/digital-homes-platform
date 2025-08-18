const mongoose = require('mongoose');

class DatabaseConfig {
    constructor() {
        this.isConnected = false;
        this.connectionString = process.env.MONGODB_URI;
    }

    async connect() {
        try {
            if (this.isConnected) {
                console.log('📊 Already connected to MongoDB Atlas');
                return;
            }

            console.log('🔗 Connecting to MongoDB Atlas...');
            
            const options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                family: 4
            };

            await mongoose.connect(this.connectionString, options);
            
            this.isConnected = true;
            console.log('✅ Connected to MongoDB Atlas successfully');
            
            // Log database info
            const dbName = mongoose.connection.db.databaseName;
            console.log(`📊 Database: ${dbName}`);
            
        } catch (error) {
            console.error('❌ MongoDB Atlas connection failed:', error.message);
            
            // Provide helpful error messages
            if (error.message.includes('authentication failed')) {
                console.error('💡 Check your username/password in the connection string');
            } else if (error.message.includes('network')) {
                console.error('💡 Check your IP whitelist in MongoDB Atlas Network Access');
            } else if (error.message.includes('ENOTFOUND')) {
                console.error('💡 Check your cluster URL in the connection string');
            }
            
            throw error;
        }
    }

    async disconnect() {
        try {
            await mongoose.disconnect();
            this.isConnected = false;
            console.log('📊 Disconnected from MongoDB Atlas');
        } catch (error) {
            console.error('❌ Error disconnecting from MongoDB:', error.message);
        }
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            name: mongoose.connection.name
        };
    }

    // Health check for monitoring
    async healthCheck() {
        try {
            await mongoose.connection.db.admin().ping();
            return {
                status: 'healthy',
                timestamp: new Date(),
                database: mongoose.connection.db.databaseName,
                collections: await mongoose.connection.db.listCollections().toArray()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date()
            };
        }
    }
}

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('📊 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('📊 Mongoose disconnected from MongoDB Atlas');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('📊 MongoDB Atlas connection closed through app termination');
    process.exit(0);
});

module.exports = new DatabaseConfig();
