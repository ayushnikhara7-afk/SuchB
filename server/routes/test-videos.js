const express = require('express');
const router = express.Router();
const {
  scheduleVideo,
  getScheduledVideos,
  updateScheduledVideo,
  deleteScheduledVideo,
  getVideoById
} = require('../controllers/videoController');

// Test routes without authentication for development
router.post('/schedule', (req, res) => {
  // Mock user for testing
  req.user = { id: '507f1f77bcf86cd799439011' }; // Mock ObjectId
  scheduleVideo(req, res);
});

router.get('/scheduled', (req, res) => {
  req.user = { id: '507f1f77bcf86cd799439011' }; // Mock ObjectId
  getScheduledVideos(req, res);
});

router.get('/:id', (req, res) => {
  req.user = { id: '507f1f77bcf86cd799439011' }; // Mock ObjectId
  getVideoById(req, res);
});

router.put('/scheduled/:id', (req, res) => {
  req.user = { id: '507f1f77bcf86cd799439011' }; // Mock ObjectId
  updateScheduledVideo(req, res);
});

router.delete('/scheduled/:id', (req, res) => {
  req.user = { id: '507f1f77bcf86cd799439011' }; // Mock ObjectId
  deleteScheduledVideo(req, res);
});

module.exports = router;
