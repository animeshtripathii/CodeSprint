const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [80, 'Team name cannot exceed 80 characters'],
    },
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: true,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    pendingInvites: [
      {
        email: { type: String },
        invitedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['forming', 'complete', 'disqualified'],
      default: 'forming',
    },
    // GitHub repo for the submission (used in Phase 7 repo tree)
    githubRepo: {
      type: String,
      default: '',
    },
    repoTree: {
      type: mongoose.Schema.Types.Mixed, // cached nested tree object
      default: null,
    },
    repoTreeFetchedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Ensure leader is always in members
teamSchema.pre('save', async function () {
  const leaderId = this.leader.toString();
  const memberIds = this.members.map((m) => m.toString());
  if (!memberIds.includes(leaderId)) {
    this.members.push(this.leader);
  }
});

// High concurrency indexes
teamSchema.index({ hackathon: 1 });
teamSchema.index({ members: 1 });

module.exports = mongoose.model('Team', teamSchema);
