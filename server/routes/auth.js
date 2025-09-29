const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { otpLimiter, loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// OTP Routes
router.post('/send-phone-otp', otpLimiter, authController.sendPhoneOTP.bind(authController));

// Signup Routes
router.post('/signup/phone', loginLimiter, authController.signupWithPhone.bind(authController));

// Signin Routes
router.post('/signin/phone', loginLimiter, authController.signinWithPhone.bind(authController));
router.post('/signin/admin', loginLimiter, authController.adminLogin.bind(authController));

// Password Reset
router.post('/reset-password', loginLimiter, authController.resetPassword.bind(authController));

// Protected Routes
router.get('/profile', authMiddleware, authController.getProfile.bind(authController));

module.exports = router;