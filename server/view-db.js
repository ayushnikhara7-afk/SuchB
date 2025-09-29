require('dotenv').config();
const mongoose = require('mongoose');

async function viewDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB Atlas!');
    
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📊 Collections in your database:');
    console.log('================================');
    
    if (collections.length === 0) {
      console.log('No collections found. Database is empty.');
    } else {
      for (const collection of collections) {
        console.log(`📁 ${collection.name}`);
        
        // Count documents in each collection
        const count = await db.collection(collection.name).countDocuments();
        console.log(`   📄 Documents: ${count}`);
        
        // Show sample documents (first 3)
        if (count > 0) {
          const sample = await db.collection(collection.name).find({}).limit(3).toArray();
          console.log('   📋 Sample documents:');
          sample.forEach((doc, index) => {
            console.log(`      ${index + 1}. ${JSON.stringify(doc, null, 2)}`);
          });
        }
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Error viewing database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

viewDatabase();
