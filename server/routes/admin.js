const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all admin routes
router.use(auth);

// Dashboard statistics
router.get('/stats', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getUsers);
router.patch('/users/:userId/status', adminController.updateUserStatus);
router.get('/users/export', adminController.exportUsers);

// Order/Payment management
router.get('/orders', adminController.getOrders);
router.get('/razorpay-payments', adminController.getRazorpayPayments);

// Content analytics
router.get('/content-analytics', adminController.getContentAnalytics);

module.exports = router;
