const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // must be the team leader
    },
    projectName: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [150, 'Project name cannot exceed 150 characters'],
    },
    problemStatement: {
      type: String,
      required: [true, 'Problem statement is required'],
      maxlength: [2000, 'Problem statement cannot exceed 2000 characters'],
    },
    solution: {
      type: String,
      required: [true, 'Solution description is required'],
      maxlength: [5000, 'Solution cannot exceed 5000 characters'],
    },
    githubRepo: {
      type: String,
      default: '',
    },
    liveDemo: {
      type: String,
      default: '',
    },
    techStack: [
      {
        type: String,
        trim: true,
      },
    ],
    screenshots: [
      {
        url: { type: String },
        publicId: { type: String }, // Cloudinary public ID
      },
    ],
    pptUrl: {
      type: String,
      default: '',
    },
    videoLink: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'under_review', 'reviewed', 'approved', 'rejected'],
      default: 'pending',
    },
    // AI-generated summary (Phase 8)
    aiSummary: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// One submission per team per hackathon
submissionSchema.index({ team: 1, hackathon: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
