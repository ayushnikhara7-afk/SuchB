const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  scheduleVideo,
  getScheduledVideos,
  updateScheduledVideo,
  deleteScheduledVideo,
  getVideoById
} = require('../controllers/videoController');

// All video routes require authentication
router.use(authenticateToken);

// Schedule a new video
router.post('/schedule', scheduleVideo);

// Get all scheduled videos for the authenticated user
router.get('/scheduled', getScheduledVideos);

// Get a specific video by ID
router.get('/:id', getVideoById);

// Update a scheduled video
router.put('/scheduled/:id', updateScheduledVideo);

// Delete a scheduled video
router.delete('/scheduled/:id', deleteScheduledVideo);

module.exports = router;
