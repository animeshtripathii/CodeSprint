const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const crypto = require('crypto');

/**
 * Register a new user
 */
const registerUser = async ({ name, email, password, role }) => {
  // Prevent self-assigning admin
  const allowedSelfRoles = ['participant', 'organizer', 'judge'];
  if (!allowedSelfRoles.includes(role)) {
    throw new ApiError(400, `Cannot self-register as '${role}'`);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: role || 'participant',
    authProvider: 'local',
  });

  return user;
};

/**
 * Login an existing user
 */
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.authProvider !== 'local') {
    throw new ApiError(400, `Please log in using ${user.authProvider}`);
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.isBlocked) {
    throw new ApiError(403, 'Your account has been blocked. Contact admin.');
  }

  return user;
};

/**
 * Get current user's profile
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

/**
 * Update current user's profile
 */
const updateProfile = async (userId, updateData) => {
  const allowedFields = ['name', 'bio', 'skills', 'avatar'];
  const filteredData = {};
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  });

  const user = await User.findByIdAndUpdate(userId, filteredData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
};

/**
 * Sync or create a user via Clerk (Google/GitHub)
 */
const syncClerkUser = async ({ clerkId, name, email, avatar }) => {
  let user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    if (avatar && !user.avatar) user.avatar = avatar;
    if (name && (user.name === 'Developer' || !user.name)) user.name = name;
    await user.save();
  } else {
    user = await User.create({
      name: name || 'Developer',
      email: email.toLowerCase(),
      role: 'participant',
      avatar: avatar || '',
      authProvider: 'google',
    });
  }

  if (user.isBlocked) {
    throw new ApiError(403, 'Your account has been blocked. Contact admin.');
  }

  return user;
};

/**
 * Request password reset token
 */
const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(404, 'User with this email does not exist');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save();
  return { resetToken, user };
};

/**
 * Reset password using token
 */
const resetPasswordWithToken = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
  return user;
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  syncClerkUser,
  requestPasswordReset,
  resetPasswordWithToken,
};
