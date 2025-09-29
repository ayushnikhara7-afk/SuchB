const bcrypt = require('bcryptjs');
const database = require('../config/database');

class User {
  constructor(userData) {
    this.phone = userData.phone;
    this.name = userData.name;
    this.password = userData.password;
    this.plan = userData.plan || null; // No default plan - user must select and pay
    this.status = userData.status || 'trial'; // Start with trial status
    this.phoneVerified = userData.phoneVerified || false;
    this.referralCode = userData.referralCode || this.generateReferralCode();
    this.referredBy = userData.referredBy;
    this.earnings = userData.earnings || 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  generateReferralCode() {
    return 'REF' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async save() {
    const db = database.getDb();
    
    // Hash password if provided
    if (this.password) {
      await this.hashPassword();
    }
    
    // Ensure unique referral code
    let isUnique = false;
    while (!isUnique) {
      const existing = await db.collection('users').findOne({ referralCode: this.referralCode });
      if (!existing) {
        isUnique = true;
      } else {
        this.referralCode = this.generateReferralCode();
      }
    }
    
    const result = await db.collection('users').insertOne(this);
    return result;
  }


  static async findByPhone(phone) {
    const db = database.getDb();
    return await db.collection('users').findOne({ phone });
  }

  static async findById(id) {
    const db = database.getDb();
    const { ObjectId } = require('mongodb');
    return await db.collection('users').findOne({ _id: new ObjectId(id) });
  }

  static async findByReferralCode(referralCode) {
    const db = database.getDb();
    return await db.collection('users').findOne({ referralCode });
  }

  static async updateById(id, updateData) {
    const db = database.getDb();
    const { ObjectId } = require('mongodb');
    updateData.updatedAt = new Date();
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    return result;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    return await this.updateById(id, { password: hashedPassword });
  }

  static async incrementEarnings(userId, amount) {
    const db = database.getDb();
    const { ObjectId } = require('mongodb');
    
    return await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $inc: { earnings: amount },
        $set: { updatedAt: new Date() }
      }
    );
  }
}

module.exports = User;