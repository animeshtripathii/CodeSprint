const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { register, getRegistrationStatus, cancel, listByHackathon, updateStatus, getMyRegistrations } = require('../controllers/registrationController');

router.post('/', protect, register);
router.get('/hackathon/:hackathonId/status', protect, getRegistrationStatus);
router.get('/me', protect, getMyRegistrations);
router.delete('/hackathon/:hackathonId', protect, cancel);
router.get('/hackathon/:hackathonId', protect, authorize('organizer', 'admin'), listByHackathon);
router.patch('/:id/status', protect, authorize('organizer', 'admin'), updateStatus);

module.exports = router;
