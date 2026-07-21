const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    approvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// A participant can only register once per hackathon
registrationSchema.index({ participant: 1, hackathon: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
