import mongoose from 'mongoose';

const workloadActionSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, default: 'ai_recommendation' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('WorkloadAction', workloadActionSchema);
