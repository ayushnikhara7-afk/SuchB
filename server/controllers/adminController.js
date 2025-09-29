const User = require('../models/User');
const database = require('../config/database');
const Razorpay = require('razorpay');

class AdminController {
  constructor() {
    // Initialize Razorpay instance for admin operations
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
    }
  }

  // Get dashboard statistics
  async getDashboardStats(req, res) {
    try {
      const db = database.getDb();
      
      // Get user statistics
      const totalUsers = await db.collection('users').countDocuments();
      const activeUsers = await db.collection('users').countDocuments({ status: 'active' });
      const trialUsers = await db.collection('users').countDocuments({ status: 'trial' });
      
      // Get plan distribution
      const planStats = await db.collection('users').aggregate([
        { $match: { plan: { $ne: null } } },
        { $group: { _id: '$plan', count: { $sum: 1 } } }
      ]).toArray();
      
      // Get revenue data from payment history
      const revenueData = await db.collection('users').aggregate([
        { $match: { 'paymentHistory.amount': { $exists: true } } },
        { $unwind: '$paymentHistory' },
        { $group: { 
          _id: null, 
          totalRevenue: { $sum: '$paymentHistory.amount' },
          totalOrders: { $sum: 1 }
        }}
      ]).toArray();
      
      // Get monthly revenue (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const monthlyRevenue = await db.collection('users').aggregate([
        { $match: { 
          'paymentHistory.paid_at': { $gte: sixMonthsAgo },
          'paymentHistory.amount': { $exists: true }
        }},
        { $unwind: '$paymentHistory' },
        { $group: {
          _id: {
            year: { $year: '$paymentHistory.paid_at' },
            month: { $month: '$paymentHistory.paid_at' }
          },
          revenue: { $sum: '$paymentHistory.amount' },
          orders: { $sum: 1 }
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]).toArray();
      
      // Get recent users (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentUsers = await db.collection('users').countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });
      
      // Get pending orders (users with trial status)
      const pendingOrders = trialUsers;
      
      // Get active live classes count (from videos collection)
      const activeLiveClasses = await db.collection('videos').countDocuments({
        status: 'scheduled',
        scheduleTime: { $gte: new Date() }
      });
      
      // Get total referrals
      const totalReferrals = await db.collection('users').countDocuments({
        referredBy: { $ne: null }
      });

      const stats = {
        totalUsers,
        activeUsers,
        trialUsers,
        recentUsers,
        totalRevenue: revenueData[0]?.totalRevenue || 0,
        monthlyRevenue: monthlyRevenue.reduce((sum, month) => sum + month.revenue, 0),
        totalOrders: revenueData[0]?.totalOrders || 0,
        pendingOrders,
        activeLiveClasses,
        totalReferrals,
        planDistribution: planStats.reduce((acc, plan) => {
          acc[plan._id] = plan.count;
          return acc;
        }, {}),
        monthlyRevenueData: monthlyRevenue.map(month => ({
          month: `${month._id.year}-${month._id.month.toString().padStart(2, '0')}`,
          revenue: month.revenue / 100, // Convert from paise to rupees
          orders: month.orders
        }))
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics'
      });
    }
  }

  // Get all users with pagination
  async getUsers(req, res) {
    try {
      const db = database.getDb();
      const { page = 1, limit = 10, search = '', status = '', plan = '' } = req.query;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Build filter
      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }
      if (status) {
        filter.status = status;
      }
      if (plan) {
        filter.plan = plan;
      }
      
      const users = await db.collection('users')
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();
      
      const total = await db.collection('users').countDocuments(filter);
      
      // Format user data
      const formattedUsers = users.map(user => ({
        id: user._id,
        name: user.name,
        phone: user.phone,
        plan: user.plan || 'No Plan',
        status: user.status,
        referralCode: user.referralCode,
        earnings: user.earnings || 0,
        phoneVerified: user.phoneVerified,
        joinedAt: user.createdAt,
        lastPayment: user.paymentHistory ? user.paymentHistory.paid_at : null,
        totalSpent: user.paymentHistory ? user.paymentHistory.amount / 100 : 0
      }));
      
      res.json({
        success: true,
        data: {
          users: formattedUsers,
          pagination: {
            current: parseInt(page),
            pageSize: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  }

  // Get payment/order data
  async getOrders(req, res) {
    try {
      const db = database.getDb();
      const { page = 1, limit = 10, status = '', plan = '' } = req.query;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Build filter for users with payment history
      const filter = { 'paymentHistory': { $exists: true } };
      if (plan) {
        filter.plan = plan;
      }
      
      const users = await db.collection('users')
        .find(filter)
        .sort({ 'paymentHistory.paid_at': -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();
      
      // Extract orders from payment history
      const orders = [];
      users.forEach(user => {
        if (user.paymentHistory) {
          orders.push({
            id: user.paymentHistory.order_id || user._id,
            customer: user.name,
            phone: user.phone,
            plan: user.plan,
            amount: user.paymentHistory.amount / 100, // Convert from paise
            currency: user.paymentHistory.currency || 'INR',
            status: user.status === 'active' ? 'Completed' : 'Pending',
            paymentId: user.paymentHistory.payment_id,
            paidAt: user.paymentHistory.paid_at,
            verifiedAt: user.paymentHistory.verified_at
          });
        }
      });
      
      // Filter by status if provided
      const filteredOrders = status ? 
        orders.filter(order => order.status.toLowerCase() === status.toLowerCase()) : 
        orders;
      
      const total = await db.collection('users').countDocuments(filter);
      
      res.json({
        success: true,
        data: {
          orders: filteredOrders,
          pagination: {
            current: parseInt(page),
            pageSize: parseInt(limit),
            total: filteredOrders.length,
            pages: Math.ceil(filteredOrders.length / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders'
      });
    }
  }

  // Get Razorpay payment details
  async getRazorpayPayments(req, res) {
    try {
      if (!this.razorpay) {
        return res.status(500).json({
          success: false,
          message: 'Razorpay not configured'
        });
      }

      const { page = 1, limit = 10, from, to } = req.query;
      
      const options = {
        count: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      };
      
      if (from && to) {
        options.from = Math.floor(new Date(from).getTime() / 1000);
        options.to = Math.floor(new Date(to).getTime() / 1000);
      }
      
      const payments = await this.razorpay.payments.all(options);
      
      res.json({
        success: true,
        data: {
          payments: payments.items,
          pagination: {
            current: parseInt(page),
            pageSize: parseInt(limit),
            total: payments.count,
            pages: Math.ceil(payments.count / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Get Razorpay payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Razorpay payments'
      });
    }
  }

  // Update user status
  async updateUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { status } = req.body;
      
      if (!['active', 'inactive', 'trial'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }
      
      const result = await User.updateById(userId, { status });
      
      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.json({
        success: true,
        message: 'User status updated successfully'
      });

    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status'
      });
    }
  }

  // Get content analytics
  async getContentAnalytics(req, res) {
    try {
      const db = database.getDb();
      
      // Get video counts
      const totalVideos = await db.collection('videos').countDocuments();
      const scheduledVideos = await db.collection('videos').countDocuments({
        status: 'scheduled'
      });
      const completedVideos = await db.collection('videos').countDocuments({
        status: 'completed'
      });
      
      // Get blog counts
      const totalBlogs = await db.collection('blogs').countDocuments();
      const publishedBlogs = await db.collection('blogs').countDocuments({
        status: 'published'
      });
      
      // Get recent content
      const recentVideos = await db.collection('videos')
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
      
      const recentBlogs = await db.collection('blogs')
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
      
      res.json({
        success: true,
        data: {
          videos: {
            total: totalVideos,
            scheduled: scheduledVideos,
            completed: completedVideos
          },
          blogs: {
            total: totalBlogs,
            published: publishedBlogs
          },
          recentVideos: recentVideos.map(video => ({
            id: video._id,
            title: video.title,
            instructor: video.instructor,
            scheduledAt: video.scheduleTime,
            status: video.status
          })),
          recentBlogs: recentBlogs.map(blog => ({
            id: blog._id,
            title: blog.title,
            author: blog.author,
            publishedAt: blog.publishedAt,
            status: blog.status
          }))
        }
      });

    } catch (error) {
      console.error('Get content analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch content analytics'
      });
    }
  }

  // Export users data
  async exportUsers(req, res) {
    try {
      const db = database.getDb();
      
      const users = await db.collection('users')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      
      const csvData = users.map(user => ({
        Name: user.name,
        Phone: user.phone,
        Plan: user.plan || 'No Plan',
        Status: user.status,
        'Referral Code': user.referralCode,
        Earnings: user.earnings || 0,
        'Phone Verified': user.phoneVerified ? 'Yes' : 'No',
        'Joined At': user.createdAt,
        'Last Payment': user.paymentHistory ? user.paymentHistory.paid_at : 'N/A',
        'Total Spent': user.paymentHistory ? (user.paymentHistory.amount / 100) : 0
      }));
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      
      // Convert to CSV
      const headers = Object.keys(csvData[0] || {});
      const csv = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');
      
      res.send(csv);

    } catch (error) {
      console.error('Export users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export users'
      });
    }
  }
}

module.exports = new AdminController();
