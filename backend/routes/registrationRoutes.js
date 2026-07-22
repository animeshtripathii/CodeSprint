const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { register, cancel, listByHackathon, updateStatus, getMyRegistrations } = require('../controllers/registrationController');

router.post('/', protect, authorize('participant'), register);
router.get('/me', protect, authorize('participant'), getMyRegistrations);
router.delete('/hackathon/:hackathonId', protect, authorize('participant'), cancel);
router.get('/hackathon/:hackathonId', protect, authorize('organizer', 'admin'), listByHackathon);
router.patch('/:id/status', protect, authorize('organizer', 'admin'), updateStatus);

module.exports = router;
