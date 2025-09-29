const { MongoClient } = require('mongodb');

class Database {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      this.client = new MongoClient(process.env.MONGODB_URI, {
        useUnifiedTopology: true,
      });
      
      await this.client.connect();
      this.db = this.client.db();
      
      console.log('Connected to MongoDB successfully');
      
      // Create indexes for better performance
      await this.createIndexes();
      
      return this.db;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async createIndexes() {
    try {
      // Users collection indexes
      // Drop existing phone index if it has sparse: true
      try {
        await this.db.collection('users').dropIndex({ phone: 1 });
        console.log('Dropped existing phone index');
      } catch (error) {
        // Index might not exist, that's okay
      }
      
      // Create new phone index without sparse
      await this.db.collection('users').createIndex({ phone: 1 }, { 
        unique: true,
        name: 'phone_1_unique'
      });
      
      // Create referral code index
      try {
        await this.db.collection('users').createIndex({ referralCode: 1 }, { 
          unique: true,
          name: 'referralCode_1_unique'
        });
      } catch (error) {
        // Index might already exist, that's okay
      }
      
      // OTP collection indexes
      await this.db.collection('otps').createIndex({ identifier: 1, type: 1 });
      await this.db.collection('otps').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      
      // Sessions collection indexes
      await this.db.collection('sessions').createIndex({ userId: 1 });
      await this.db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      
      console.log('Database indexes created successfully');
    } catch (error) {
      console.error('Error creating indexes:', error);
    }
  }

  getDb() {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

module.exports = new Database();