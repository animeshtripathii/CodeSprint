const mongoose = require('mongoose');

const hackathonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    theme: {
      type: String,
      trim: true,
      default: '',
    },
    mode: {
      type: String,
      enum: ['online', 'offline', 'hybrid'],
      default: 'online',
    },
    venue: {
      type: String,
      default: '',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
    },
    banner: {
      type: String, // Cloudinary URL
      default: '',
    },
    prizePool: {
      type: String,
      default: '',
    },
    maxTeamSize: {
      type: Number,
      default: 4,
      min: [1, 'Max team size must be at least 1'],
    },
    minTeamSize: {
      type: Number,
      default: 1,
    },
    rules: {
      type: String,
      default: '',
    },
    judgingCriteria: [
      {
        criterion: { type: String, required: true },
        maxScore: { type: Number, default: 10 },
        description: { type: String, default: '' },
      },
    ],
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    judges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'upcoming', 'open', 'ongoing', 'ended', 'cancelled'],
      default: 'draft',
    },
    tags: [{ type: String, trim: true }],
    totalPrize: { type: Number, default: 0 },
    website: { type: String, default: '' },
  },
  { timestamps: true }
);

// Validate dates before save — only when dates change or it's a new document
hackathonSchema.pre('save', async function () {
  const shouldValidate = this.isNew ||
    this.isModified('startDate') ||
    this.isModified('endDate') ||
    this.isModified('registrationDeadline');
  if (!shouldValidate) return;

  if (this.endDate <= this.startDate) {
    throw new Error('End date must be after start date');
  }
  if (this.registrationDeadline >= this.startDate) {
    throw new Error('Registration deadline must be before start date');
  }
});

// High concurrency indexes
hackathonSchema.index({ organizer: 1 });
hackathonSchema.index({ status: 1 });
hackathonSchema.index({ judges: 1 });

module.exports = mongoose.model('Hackathon', hackathonSchema);
