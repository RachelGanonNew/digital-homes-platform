const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServer;

// Setup for Jest tests using in-memory MongoDB
beforeAll(async () => {
  mongoMemoryServer = await MongoMemoryServer.create();
  const uri = mongoMemoryServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  // Clean up and close connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
});

afterEach(async () => {
  // Clean up after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});