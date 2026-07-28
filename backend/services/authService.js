const User = require('../models/User');
const Registration = require('../models/Registration');
const Team = require('../models/Team');
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

  // Include isDeleted in the query so we can detect soft-deleted accounts
  const existingUser = await User.findOne({ email: cleanEmail }).select('+isDeleted');

  if (existingUser) {
    if (existingUser.isDeleted) {
      // The email belongs to a previously deleted account — reactivate it with fresh credentials.
      // This lets users re-register with the same email after account deletion.
      existingUser.name = cleanName;
      existingUser.password = password;          // will be hashed by pre-save hook
      existingUser.role = role || 'participant';
      existingUser.authProvider = 'local';
      existingUser.isDeleted = false;
      existingUser.isBlocked = false;
      existingUser.bio = '';
      existingUser.skills = [];
      existingUser.avatar = '';
      existingUser.resetPasswordToken = undefined;
      existingUser.resetPasswordExpire = undefined;
      await existingUser.save();
      return existingUser;
    }
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
  // Explicitly select isDeleted so we can handle previously deleted accounts
  let user = await User.findOne({ email: cleanEmail }).select('+isDeleted');

  if (user) {
    if (user.isDeleted) {
      // Previously deleted account — reactivate it for the OAuth user.
      // This mirrors the same behaviour as email/password re-registration.
      user.isDeleted = false;
      user.isBlocked = false;
      user.authProvider = 'google';
      user.avatar = avatar || user.avatar || '';
      user.name = (name || user.name || 'Developer').trim();
    } else {
      if (avatar && !user.avatar) user.avatar = avatar;
      if (name && (user.name === 'Developer' || !user.name)) user.name = (name || '').trim();
    }
    await user.save();
  } else {
    // Brand new Google/GitHub user — create fresh account
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

/**
 * Delete account for self (non-admin roles only)
 */
const deleteAccount = async (userId) => {
  const user = await User.findById(userId).select('+isDeleted');
  if (!user) throw new ApiError(404, 'User not found');
  if (user.isDeleted) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') {
    throw new ApiError(403, 'Admin accounts cannot be self-deleted');
  }

  // Soft-delete: mark as deleted so Clerk users cannot be auto-recreated on next login
  // Also clean up team & registration references
  await Promise.all([
    Registration.deleteMany({ user: userId }),
    Team.updateMany({ members: userId }, { $pull: { members: userId } }),
    User.findByIdAndUpdate(userId, { isDeleted: true, isBlocked: true }),
  ]);

  return { message: 'Account deleted successfully' };
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  syncClerkUser,
  requestPasswordReset,
  resetPasswordWithToken,
  deleteAccount,
};
