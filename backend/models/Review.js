const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
    },
    judge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: true,
    },
    // scores per judging criterion: { "Innovation": 8, "Feasibility": 9, ... }
    scores: {
      type: Map,
      of: Number,
      default: {},
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    comments: {
      type: String,
      maxlength: [3000, 'Comments cannot exceed 3000 characters'],
      default: '',
    },
    // AI-polished feedback (Phase 8)
    aiFeedback: {
      type: String,
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: false, // organizer publishes after all reviews done
    },
  },
  { timestamps: true }
);

// One review per judge per submission
reviewSchema.index({ submission: 1, judge: 1 }, { unique: true });

// Auto-compute totalScore before save
reviewSchema.pre('save', async function () {
  if (this.scores && this.scores.size > 0) {
    let total = 0;
    this.scores.forEach((val) => (total += val));
    this.totalScore = parseFloat((total / this.scores.size).toFixed(2));
  }
});

module.exports = mongoose.model('Review', reviewSchema);
