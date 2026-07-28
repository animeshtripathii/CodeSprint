import mongoose from 'mongoose';

const labelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, required: true, default: '#6366f1' },
});

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'member', 'editor', 'viewer'], default: 'member' },
});

const boardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    color: { type: String, default: '#1a7fd4' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [memberSchema],
    labels: [labelSchema],
  },
  { timestamps: true }
);

// Index for fast "boards I'm a member of" queries
boardSchema.index({ 'members.userId': 1 });

export default mongoose.model('Board', boardSchema);
