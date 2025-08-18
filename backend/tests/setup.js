const mongoose = require('mongoose');

// Setup for Jest tests
beforeAll(async () => {
  // Use test database
  const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/digitalhomes_test';
  await mongoose.connect(testDbUri);
});

afterAll(async () => {
  // Clean up and close connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  // Clean up after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
