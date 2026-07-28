import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const taskSchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    columnId: { type: mongoose.Schema.Types.ObjectId, ref: 'Column', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    position: { type: Number, required: true, default: 0 },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    dueDate: { type: Date, default: null },
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    labelIds: [{ type: mongoose.Schema.Types.ObjectId }],
    subtasks: [subtaskSchema],
    completedAt: { type: Date, default: null },
    activityLog: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        action: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

taskSchema.index({ columnId: 1, position: 1 });
taskSchema.index({ boardId: 1 });
taskSchema.index({ assigneeId: 1 });

export default mongoose.model('Task', taskSchema);
