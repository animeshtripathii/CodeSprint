import mongoose from 'mongoose';

const columnSchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    title: { type: String, required: true, trim: true },
    position: { type: Number, required: true, default: 0 },
    wipLimit: { type: Number, default: null }, // null = no limit
  },
  { timestamps: true }
);

columnSchema.index({ boardId: 1, position: 1 });

export default mongoose.model('Column', columnSchema);
