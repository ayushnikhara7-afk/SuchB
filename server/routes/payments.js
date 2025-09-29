const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

// Create payment order
router.post('/create-order', authMiddleware, paymentController.createOrder.bind(paymentController));

// Verify payment
router.post('/verify', authMiddleware, paymentController.verifyPayment.bind(paymentController));

// Get payment history
router.get('/history', authMiddleware, paymentController.getPaymentHistory.bind(paymentController));

// Cancel subscription
router.post('/cancel', authMiddleware, paymentController.cancelSubscription.bind(paymentController));

module.exports = router;
