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

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (name || '').trim();

  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  const user = await User.create({
    name: cleanName,
    email: cleanEmail,
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
  const cleanEmail = (email || '').trim().toLowerCase();
  const user = await User.findOne({ email: cleanEmail }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.authProvider !== 'local') {
    const providerName = user.authProvider === 'google' ? 'Google' : user.authProvider === 'github' ? 'GitHub' : user.authProvider;
    throw new ApiError(400, `This account was registered using ${providerName}. Please sign in using ${providerName}.`);
  }

  if (!user.password) {
    throw new ApiError(401, 'Invalid email or password');
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
  const cleanEmail = (email || '').trim().toLowerCase();
  let user = await User.findOne({ email: cleanEmail });

  if (user) {
    if (avatar && !user.avatar) user.avatar = avatar;
    if (name && (user.name === 'Developer' || !user.name)) user.name = (name || '').trim();
    await user.save();
  } else {
    user = await User.create({
      name: (name || 'Developer').trim(),
      email: cleanEmail,
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
  const cleanEmail = (email || '').trim().toLowerCase();
  const user = await User.findOne({ email: cleanEmail });
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
