require('dotenv').config();
const mongoose = require('mongoose');

async function publishBlog() {
  try {
    console.log('🔄 Publishing "Yoga by Boga" blog...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB Atlas!');
    
    // Get the database
    const db = mongoose.connection.db;
    const blogsCollection = db.collection('blogs');
    
    // Update the blog status to published
    const result = await blogsCollection.updateOne(
      { title: "Yoga by Boga" },
      { 
        $set: { 
          status: "published",
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount > 0) {
      console.log('✅ Successfully published "Yoga by Boga" blog!');
      
      // Verify the update
      const updatedBlog = await blogsCollection.findOne({ title: "Yoga by Boga" });
      console.log('📝 Updated blog status:', updatedBlog.status);
    } else {
      console.log('❌ Blog not found or update failed');
    }
    
  } catch (error) {
    console.error('❌ Error publishing blog:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

publishBlog();
