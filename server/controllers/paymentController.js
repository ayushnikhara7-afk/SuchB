const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

class PaymentController {
  constructor() {
    console.log('🔧 Razorpay Config Check:');
    console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'SET' : 'NOT SET');
    console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT SET');
    
    try {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error('❌ Razorpay credentials not configured!');
        console.error('Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file');
        this.razorpay = null;
        return;
      }
      
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      
      console.log('✅ Razorpay instance created successfully');
      console.log('Razorpay instance:', this.razorpay ? 'EXISTS' : 'NULL');
    } catch (error) {
      console.error('❌ Error creating Razorpay instance:', error);
      this.razorpay = null;
    }
  }

  // Create a Razorpay order
  async createOrder(req, res) {
    try {
      console.log('🔍 Create Order Request:');
      console.log('this.razorpay:', this.razorpay ? 'EXISTS' : 'NULL');
      console.log('Request body:', req.body);
      console.log('User ID:', req.userId);
      
      if (!this.razorpay) {
        console.error('❌ Razorpay instance is null');
        return res.status(500).json({
          success: false,
          message: 'Payment system not configured. Please contact support.'
        });
      }

      const { amount, currency = 'INR', plan_id } = req.body;
      const userId = req.userId;

      if (!amount || !plan_id || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Amount, plan_id, and user authentication are required'
        });
      }

      // Validate plan
      const validPlans = {
        'quarterly': { price: 999, name: 'Quarterly Plan' },
        'half-yearly': { price: 1899, name: 'Half-Yearly Plan' },
        'annually': { price: 3499, name: 'Annual Plan' }
      };

      if (!validPlans[plan_id]) {
        return res.status(400).json({
          success: false,
          message: 'Invalid plan selected'
        });
      }

      // Use the plan price directly (no additional billing cycle calculations)
      let finalAmount = validPlans[plan_id].price;

      // Validate amount
      if (amount !== finalAmount) {
        return res.status(400).json({
          success: false,
          message: 'Invalid amount for selected plan'
        });
      }

      // Create Razorpay order
      const receiptId = `${Date.now()}${userId.toString().slice(-6)}`;
      const options = {
        amount: amount * 100, // Convert to paise
        currency,
        receipt: receiptId,
        notes: {
          plan_id,
          user_id: userId
        }
      };

      console.log('📋 Creating Razorpay order with options:', JSON.stringify(options, null, 2));
      
      const order = await this.razorpay.orders.create(options);
      
      console.log('✅ Razorpay order created successfully:', order.id);

      res.json({
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt
        },
        razorpay_key_id: process.env.RAZORPAY_KEY_ID
      });

    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment order'
      });
    }
  }

  // Verify payment signature and payment status
  async verifyPayment(req, res) {
    try {
      console.log('🔍 Starting payment verification...');
      
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        plan_id,
      } = req.body;
      const userId = req.userId;

      console.log('📋 Verification data:', {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        plan_id,
        user_id: userId
      });

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        console.error('❌ Missing payment verification data');
        return res.status(400).json({
          success: false,
          message: 'Missing payment verification data'
        });
      }

      // Step 1: Verify signature using Razorpay's method
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      const isSignatureValid = expectedSignature === razorpay_signature;
      console.log('🔐 Signature verification:', isSignatureValid ? '✅ Valid' : '❌ Invalid');

      if (!isSignatureValid) {
        console.error('❌ Invalid payment signature');
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature - payment may be fraudulent'
        });
      }

      // Step 2: Verify payment status with Razorpay API
      console.log('🔍 Fetching payment details from Razorpay...');
      const payment = await this.razorpay.payments.fetch(razorpay_payment_id);
      
      console.log('💳 Payment details:', {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        order_id: payment.order_id
      });

      // Step 3: Validate payment status
      if (payment.status !== 'captured') {
        console.error('❌ Payment not captured. Status:', payment.status);
        return res.status(400).json({
          success: false,
          message: `Payment not successful. Status: ${payment.status}`
        });
      }

      // Step 4: Validate order matches
      if (payment.order_id !== razorpay_order_id) {
        console.error('❌ Order ID mismatch');
        return res.status(400).json({
          success: false,
          message: 'Order ID mismatch - payment verification failed'
        });
      }

      // Step 5: Validate plan and amount
      const validPlans = {
        'quarterly': 999,
        'half-yearly': 1899,
        'annually': 3499
      };

      if (!validPlans[plan_id]) {
        console.error('❌ Invalid plan ID:', plan_id);
        return res.status(400).json({
          success: false,
          message: 'Invalid plan selected'
        });
      }

      const expectedAmount = validPlans[plan_id] * 100; // Convert to paise
      if (payment.amount !== expectedAmount) {
        console.error('❌ Amount mismatch. Expected:', expectedAmount, 'Actual:', payment.amount);
        return res.status(400).json({
          success: false,
          message: 'Payment amount mismatch'
        });
      }

      console.log('✅ All verification checks passed!');

      // Step 6: Update user plan with verified payment details
      console.log('👤 Updating user plan...');
      const updateData = {
        plan: plan_id,
        status: 'active',
        paymentHistory: {
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          plan_id,
          amount: payment.amount,
          currency: payment.currency,
          paid_at: new Date(),
          verified_at: new Date()
        }
      };

      await User.updateById(userId, updateData);
      console.log('✅ User plan updated successfully');

      res.json({
        success: true,
        message: 'Payment verified and plan activated successfully',
        payment: {
          id: razorpay_payment_id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status
        },
        user: {
          plan: plan_id,
          status: 'active'
        }
      });

    } catch (error) {
      console.error('❌ Payment verification error:', error);
      
      // Handle specific Razorpay API errors
      if (error.statusCode === 400) {
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed - invalid payment data'
        });
      }
      
      if (error.statusCode === 401) {
        return res.status(500).json({
          success: false,
          message: 'Payment verification failed - authentication error'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Payment verification failed - server error'
      });
    }
  }

  // Get payment history
  async getPaymentHistory(req, res) {
    try {
      const userId = req.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        paymentHistory: user.paymentHistory || [],
        currentPlan: user.plan,
        status: user.status
      });

    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment history'
      });
    }
  }

  // Cancel subscription
  async cancelSubscription(req, res) {
    try {
      const userId = req.userId;
      
      // Update user status to inactive
      await User.updateById(userId, { 
        status: 'inactive',
        cancelledAt: new Date()
      });

      res.json({
        success: true,
        message: 'Subscription cancelled successfully'
      });

    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription'
      });
    }
  }
}

const paymentController = new PaymentController();
console.log('📦 PaymentController instantiated:', paymentController ? 'SUCCESS' : 'FAILED');
console.log('📦 Razorpay instance in controller:', paymentController.razorpay ? 'EXISTS' : 'NULL');

module.exports = paymentController;
