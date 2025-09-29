const database = require('../config/database');

// Schedule a new video
const scheduleVideo = async (req, res) => {
  try {
    const { title, description, youtubeUrl, scheduleDate, scheduleTime, duration, category } = req.body;
    const createdBy = req.user.id; // Assuming user is attached by auth middleware

    // Validate required fields
    if (!title || !description || !youtubeUrl || !scheduleDate || !scheduleTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if the scheduled time is in the future
    const scheduledDateTime = new Date(`${scheduleDate.split('T')[0]}T${scheduleTime.split('T')[1]}`);
    if (scheduledDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time must be in the future'
      });
    }

    const db = database.getDb();
    const { ObjectId } = require('mongodb');
    
    const videoData = {
      title,
      description,
      youtubeUrl,
      scheduleDate: new Date(scheduleDate),
      scheduleTime: new Date(scheduleTime),
      duration,
      category,
      status: 'scheduled',
      createdBy: new ObjectId(createdBy),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('videos').insertOne(videoData);
    const video = { _id: result.insertedId, ...videoData };

    res.status(201).json({
      success: true,
      message: 'Video scheduled successfully',
      data: video
    });
  } catch (error) {
    console.error('Error scheduling video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule video',
      error: error.message
    });
  }
};

// Get all scheduled videos
const getScheduledVideos = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category } = req.query;
    const createdBy = req.user.id;
    const db = database.getDb();
    const { ObjectId } = require('mongodb');

    const filter = { createdBy: new ObjectId(createdBy), isActive: true };
    if (status) filter.status = status;
    if (category) filter.category = new RegExp(category, 'i');

    const videos = await db.collection('videos')
      .find(filter)
      .sort({ scheduleDate: 1, scheduleTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .toArray();

    const total = await db.collection('videos').countDocuments(filter);

    res.json({
      success: true,
      data: videos,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching scheduled videos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled videos',
      error: error.message
    });
  }
};

// Update a scheduled video
const updateScheduledVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const createdBy = req.user.id;
    const db = database.getDb();
    const { ObjectId } = require('mongodb');

    // Remove fields that shouldn't be updated directly
    delete updates.createdBy;
    delete updates._id;
    delete updates.createdAt;
    updates.updatedAt = new Date();

    const result = await db.collection('videos').findOneAndUpdate(
      { _id: new ObjectId(id), createdBy: new ObjectId(createdBy), isActive: true },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({
        success: false,
        message: 'Video not found or you do not have permission to update it'
      });
    }

    res.json({
      success: true,
      message: 'Video updated successfully',
      data: result.value
    });
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update video',
      error: error.message
    });
  }
};

// Delete a scheduled video
const deleteScheduledVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const createdBy = req.user.id;
    const db = database.getDb();
    const { ObjectId } = require('mongodb');

    const result = await db.collection('videos').findOneAndUpdate(
      { _id: new ObjectId(id), createdBy: new ObjectId(createdBy), isActive: true },
      { $set: { isActive: false, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({
        success: false,
        message: 'Video not found or you do not have permission to delete it'
      });
    }

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete video',
      error: error.message
    });
  }
};

// Get video by ID
const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const createdBy = req.user.id;
    const db = database.getDb();
    const { ObjectId } = require('mongodb');

    const video = await db.collection('videos').findOne({ 
      _id: new ObjectId(id), 
      createdBy: new ObjectId(createdBy), 
      isActive: true 
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video',
      error: error.message
    });
  }
};

module.exports = {
  scheduleVideo,
  getScheduledVideos,
  updateScheduledVideo,
  deleteScheduledVideo,
  getVideoById
};
