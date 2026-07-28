import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    onTimeCount: { type: Number, default: 0 },
    lateCount: { type: Number, default: 0 },
    onTimeRate: { type: Number, default: 0 },
    activeTaskCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Never return passwordHash in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export default mongoose.model('User', userSchema);
