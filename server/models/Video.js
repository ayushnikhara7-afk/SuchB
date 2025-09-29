const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  youtubeUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(v);
      },
      message: 'Please enter a valid YouTube URL'
    }
  },
  scheduleDate: {
    type: Date,
    required: true
  },
  scheduleTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    min: 1
  },
  category: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
videoSchema.index({ scheduleDate: 1, scheduleTime: 1 });
videoSchema.index({ status: 1 });
videoSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Video', videoSchema);
