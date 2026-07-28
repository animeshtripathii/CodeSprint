import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Null for AI replies
    text: { type: String, required: true },
    isAI: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('ChatMessage', chatMessageSchema);
