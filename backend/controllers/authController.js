const asyncHandler = require('express-async-handler');
const authService = require('../services/authService');
const generateToken = require('../utils/generateToken');
const ApiResponse = require('../utils/ApiResponse');

/**
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const user = await authService.registerUser({ name, email, password, role });
  const token = generateToken(res, user._id, user.role);

  return res.status(201).json(
    new ApiResponse(201, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    }, 'Registered successfully')
  );
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUser({ email, password });
  const token = generateToken(res, user._id, user.role);

  return res.status(200).json(
    new ApiResponse(200, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    }, 'Logged in successfully')
  );
});

/**
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  return res.status(200).json(new ApiResponse(200, {}, 'Logged out successfully'));
});

/**
 * GET /api/auth/me  (protected)
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user._id);
  return res.status(200).json(new ApiResponse(200, user, 'Profile fetched'));
});

/**
 * PUT /api/auth/me  (protected)
 */
const updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, user, 'Profile updated'));
});

/**
 * POST /api/auth/clerk-sync
 */
const clerkSync = asyncHandler(async (req, res) => {
  const { clerkId, name, email, avatar } = req.body;
  if (!email) {
    throw new ApiError(400, 'Email is required for Clerk sync');
  }

  const user = await authService.syncClerkUser({ clerkId, name, email, avatar });
  const token = generateToken(res, user._id, user.role);

  return res.status(200).json(
    new ApiResponse(200, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    }, 'Clerk user synced successfully')
  );
});

module.exports = { register, login, logout, getMe, updateMe, clerkSync };
