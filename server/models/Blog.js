const database = require('../config/database');

class Blog {
  constructor(blogData) {
    this.title = blogData.title;
    this.content = blogData.content; 
    this.author = blogData.author;
    this.tags = blogData.tags || [];
    this.category = blogData.category;
    this.featuredImage = blogData.featuredImage;
    this.status = blogData.status || 'draft'; // draft, published, archived
    this.isActive = blogData.isActive !== undefined ? blogData.isActive : true;
    this.views = 0;
    this.likes = 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async save() {
    const db = database.getDb();
     
    
    const result = await db.collection('blogs').insertOne(this);
    return result;
  }

  static async findById(id) {
    const db = database.getDb();
    const { ObjectId } = require('mongodb');
    return await db.collection('blogs').findOne({ _id: new ObjectId(id) });
  }

  static async findByAuthor(authorId) {
    const db = database.getDb();
    const { ObjectId } = require('mongodb');
    return await db.collection('blogs').find({ 
      author: new ObjectId(authorId), 
      isActive: true 
    }).sort({ createdAt: -1 }).toArray();
  }

  static async findPublished() {
    const db = database.getDb();
    return await db.collection('blogs').find({ 
      status: 'published', 
      isActive: true 
    }).sort({ createdAt: -1 }).toArray();
  }

  static async updateById(id, updateData) {
    const db = database.getDb();
    const { ObjectId } = require('mongodb');
    updateData.updatedAt = new Date();
    
    const result = await db.collection('blogs').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    return result;
  }

  static async deleteById(id) {
    const db = database.getDb();
    const { ObjectId } = require('mongodb');
    
    const result = await db.collection('blogs').updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: false, updatedAt: new Date() } }
    );
    return result;
  }

  static async incrementViews(id) {
    const db = database.getDb();
    const { ObjectId } = require('mongodb');
    
    return await db.collection('blogs').updateOne(
      { _id: new ObjectId(id) },
      { 
        $inc: { views: 1 },
        $set: { updatedAt: new Date() }
      }
    );
  }
}

module.exports = Blog;
