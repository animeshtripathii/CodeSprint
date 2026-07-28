const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned in queries by default
      required: function () {
        // password only required for local auth
        return this.authProvider === 'local';
      },
    },
    role: {
      type: String,
      enum: ['admin', 'organizer', 'participant', 'judge'],
      default: 'participant',
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    isBlocked: {
      type: Boolean,
      default: false,
    },
    // Soft-delete flag — when true the account is deactivated and cannot be
    // re-created by OAuth (Google/GitHub) clerk-sync auto-provisioning.
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,   // hidden from normal queries; middleware checks it explicitly
    },
    // OAuth fields (for later)
    googleId: { type: String, default: null },
    githubId: { type: String, default: null },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local',
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// ─── Hash password before save ─────────────────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Compare password method ───────────────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
