const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      trim: true,
    },
    // If this message is a reply from the AI assistant (@ai)
    isAiMessage: {
      type: Boolean,
      default: false,
    },
    // Read by which users
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

// Index for efficient pagination by team + time
messageSchema.index({ team: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
