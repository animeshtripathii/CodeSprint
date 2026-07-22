const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, updateMe, clerkSync } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/clerk-sync', clerkSync);

// Protected routes (require valid JWT)
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;
