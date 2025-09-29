const database = require('../config/database');

class OTP {
  constructor(otpData) {
    this.identifier = otpData.identifier; // email or phone
    this.type = otpData.type; // 'email' or 'phone'
    this.code = otpData.code;
    this.purpose = otpData.purpose; // 'signup', 'signin', 'password_reset'
    this.attempts = 0;
    this.maxAttempts = parseInt(process.env.MAX_OTP_ATTEMPTS) || 3;
    this.expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000);
    this.createdAt = new Date();
    this.verified = false;
  }

  generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async save() {
    const db = database.getDb();
    
    // Remove any existing OTP for the same identifier and purpose
    await db.collection('otps').deleteMany({
      identifier: this.identifier,
      purpose: this.purpose
    });
    
    // Generate new OTP code
    this.code = this.generateCode();
    
    const result = await db.collection('otps').insertOne(this);
    return result;
  }

  static async findValid(identifier, purpose) {
    const db = database.getDb();
    return await db.collection('otps').findOne({
      identifier,
      purpose,
      verified: false,
      expiresAt: { $gt: new Date() },
      attempts: { $lt: parseInt(process.env.MAX_OTP_ATTEMPTS) || 3 }
    });
  }

  static async verify(identifier, code, purpose) {
    const db = database.getDb();
    
    const otp = await this.findValid(identifier, purpose);
    if (!otp) {
      return { success: false, message: 'OTP expired or not found' };
    }

    // Increment attempts
    await db.collection('otps').updateOne(
      { _id: otp._id },
      { $inc: { attempts: 1 } }
    );

    if (otp.code !== code) {
      const remainingAttempts = otp.maxAttempts - (otp.attempts + 1);
      if (remainingAttempts <= 0) {
        await db.collection('otps').updateOne(
          { _id: otp._id },
          { $set: { verified: false, expiresAt: new Date() } }
        );
        return { success: false, message: 'Maximum attempts exceeded. Please request a new OTP.' };
      }
      return { success: false, message: `Invalid OTP. ${remainingAttempts} attempts remaining.` };
    }

    // Mark as verified
    await db.collection('otps').updateOne(
      { _id: otp._id },
      { $set: { verified: true } }
    );

    return { success: true, message: 'OTP verified successfully' };
  }

  static async cleanup() {
    const db = database.getDb();
    // Remove expired OTPs
    await db.collection('otps').deleteMany({
      expiresAt: { $lt: new Date() }
    });
  }
}

module.exports = OTP;