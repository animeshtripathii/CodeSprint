const mongoose = require('mongoose');

const communityMessageSchema = new mongoose.Schema(
  {
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    channel: {
      type: String,
      enum: ['announcements', 'general', 'judges'],
      default: 'general',
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
  },
  { timestamps: true }
);

// Performance index for fetching channel messages quickly
communityMessageSchema.index({ hackathon: 1, channel: 1, createdAt: -1 });

module.exports = mongoose.model('CommunityMessage', communityMessageSchema);
