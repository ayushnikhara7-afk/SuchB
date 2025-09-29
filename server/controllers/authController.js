const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const database = require('../config/database');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const whatsappService = require('../services/whatsappService');

class AuthController {
  // Generate JWT token
  generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }


  // Validate phone format (Indian format)
  isValidPhone(phone) {
    const phoneRegex = /^(\+91|91)?[6789]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  // Normalize phone number
  normalizePhone(phone) {
    const cleaned = phone.replace(/\s+/g, '');
    if (cleaned.startsWith('+91')) return cleaned;
    if (cleaned.startsWith('91')) return '+' + cleaned;
    return '+91' + cleaned;
  }


  // Send OTP for phone
  async sendPhoneOTP(req, res) {
    try {
      const { phone, purpose } = req.body;

      if (!phone || !this.isValidPhone(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Valid phone number is required'
        });
      }

      const normalizedPhone = this.normalizePhone(phone);

      if (!['signup', 'signin', 'password_reset'].includes(purpose)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid purpose'
        });
      }

      // Check if user exists based on purpose
      const existingUser = await User.findByPhone(normalizedPhone);
      
      if (purpose === 'signup' && existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this phone number'
        });
      }

      if ((purpose === 'signin' || purpose === 'password_reset') && !existingUser) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this phone number'
        });
      }

      // Create and save OTP
      const otp = new OTP({
        identifier: normalizedPhone,
        type: 'phone',
        purpose
      });

      await otp.save();

      // Send OTP via both SMS and WhatsApp
      const smsResult = await smsService.sendOTP(normalizedPhone, otp.code, purpose);
      const whatsappResult = await whatsappService.sendOTP(normalizedPhone, otp.code, purpose);
      
      // Consider success if either SMS or WhatsApp succeeds
      if (!smsResult.success && !whatsappResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP via SMS and WhatsApp'
        });
      }

      // Log the results for debugging
      console.log(`SMS result: ${smsResult.success ? 'Success' : 'Failed'}`);
      console.log(`WhatsApp result: ${whatsappResult.success ? 'Success' : 'Failed'}`);

      res.json({
        success: true,
        message: 'OTP sent to your WhatsApp and SMS successfully',
        expiresIn: process.env.OTP_EXPIRY_MINUTES || 10
      });

    } catch (error) {
      console.error('Send phone OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }



  // Phone signup with OTP
  async signupWithPhone(req, res) {
    try {
      const { phone, otp, name, referralCode } = req.body;

      if (!phone || !otp || !name) {
        return res.status(400).json({
          success: false,
          message: 'Phone, OTP, and name are required'
        });
      }

      const normalizedPhone = this.normalizePhone(phone);

      // Verify OTP
      const otpResult = await OTP.verify(normalizedPhone, otp, 'signup');
      if (!otpResult.success) {
        return res.status(400).json({
          success: false,
          message: otpResult.message
        });
      }

      // Check if user already exists
      const existingUser = await User.findByPhone(normalizedPhone);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }

      // Validate referral code if provided
      let referrer = null;
      if (referralCode) {
        referrer = await User.findByReferralCode(referralCode);
        if (!referrer) {
          return res.status(400).json({
            success: false,
            message: 'Invalid referral code'
          });
        }
      }

      // Create new user
      const userData = {
        phone: normalizedPhone,
        name,
        phoneVerified: true,
        referredBy: referrer?._id,
        status: 'trial',
        plan: null // No default plan - user must select and pay
      };

      const user = new User(userData);
      const result = await user.save();

      // Award referral bonus
      if (referrer) {
        await User.incrementEarnings(referrer._id, 500);
      }

      // Generate token
      const token = this.generateToken(result.insertedId);

      // Send welcome messages via both SMS and WhatsApp
      await smsService.sendWelcomeSMS(normalizedPhone, name);
      await whatsappService.sendWelcomeMessage(normalizedPhone, name);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          id: result.insertedId,
          phone: user.phone,
          name: user.name,
          plan: user.plan,
          status: user.status,
          referralCode: user.referralCode,
          earnings: user.earnings
        }
      });

    } catch (error) {
      console.error('Phone signup error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }



  // Phone signin with OTP
  async signinWithPhone(req, res) {
    try {
      const { phone, otp } = req.body;

      if (!phone || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Phone and OTP are required'
        });
      }

      const normalizedPhone = this.normalizePhone(phone);

      // Verify OTP
      const otpResult = await OTP.verify(normalizedPhone, otp, 'signin');
      if (!otpResult.success) {
        return res.status(400).json({
          success: false,
          message: otpResult.message
        });
      }

      // Find user
      const user = await User.findByPhone(normalizedPhone);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Mark phone as verified if not already
      if (!user.phoneVerified) {
        await User.updateById(user._id, { phoneVerified: true });
      }

      // Generate token
      const token = this.generateToken(user._id);

      res.json({
        success: true,
        message: 'Signed in successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          plan: user.plan,
          status: user.status,
          referralCode: user.referralCode,
          earnings: user.earnings,
          joinedAt: user.createdAt
        }
      });

    } catch (error) {
      console.error('Phone signin error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Reset password with OTP
  async resetPassword(req, res) {
    try {
      const { phone, otp, newPassword } = req.body;

      if (!phone || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Phone, OTP, and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      const normalizedPhone = this.normalizePhone(phone);

      // Verify OTP
      const otpResult = await OTP.verify(normalizedPhone, otp, 'password_reset');
      if (!otpResult.success) {
        return res.status(400).json({
          success: false,
          message: otpResult.message
        });
      }

      // Find user
      const user = await User.findByPhone(normalizedPhone);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update password
      await User.updatePassword(user._id, newPassword);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Admin login with email and password
  async adminLogin(req, res) {
    try {
      const { email, password } = req.body;

      console.log('🔍 Admin login attempt:', { email });

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find admin user by email
      const db = database.getDb();
      const adminUser = await db.collection('users').findOne({ 
        email: email.toLowerCase(),
        role: 'admin'
      });

      console.log('🔍 Admin user found:', adminUser ? 'Yes' : 'No');

      if (!adminUser) {
        console.log('❌ Admin user not found');
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials'
        });
      }

      // Verify password
      const isPasswordValid = await User.verifyPassword(password, adminUser.password);
      console.log('🔍 Password valid:', isPasswordValid);

      if (!isPasswordValid) {
        console.log('❌ Invalid password');
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials'
        });
      }

      // Generate token
      const token = this.generateToken(adminUser._id);
      console.log('✅ Admin login successful, token generated');

      res.json({
        success: true,
        message: 'Admin login successful',
        token,
        user: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          plan: adminUser.plan,
          status: adminUser.status,
          joinedAt: adminUser.createdAt
        }
      });

    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user profile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          plan: user.plan,
          status: user.status,
          referralCode: user.referralCode,
          earnings: user.earnings,
          phoneVerified: user.phoneVerified,
          joinedAt: user.createdAt
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new AuthController();