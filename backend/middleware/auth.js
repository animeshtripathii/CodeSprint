const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * protect — verifies JWT from Authorization header or httpOnly cookie.
 * Attaches the user document to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Try Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback to cookie
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized — no token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Explicitly select isDeleted (it has select:false in the schema)
  const user = await User.findById(decoded.id).select('-password +isDeleted');

  if (!user) {
    throw new ApiError(401, 'User no longer exists');
  }

  if (user.isDeleted) {
    throw new ApiError(401, 'This account has been deleted');
  }

  if (user.isBlocked) {
    throw new ApiError(403, 'Your account has been blocked. Contact admin.');
  }

  req.user = user;
  next();
});

/**
 * authorize — role-based access guard. Must be used after protect.
 * Usage: authorize('admin', 'organizer')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, `Role '${req.user.role}' is not authorized for this action`);
    }
    next();
  };
};

module.exports = { protect, authorize };
