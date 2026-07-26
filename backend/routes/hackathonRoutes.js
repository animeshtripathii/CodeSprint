const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createUploader } = require('../config/cloudinary');
const {
  listHackathons, getHackathon, createHackathon, updateHackathon,
  deleteHackathon, getAvailableJudges, assignJudge, removeJudge,
} = require('../controllers/hackathonController');

const bannerUpload = createUploader('banners');

// Public
router.get('/', listHackathons);
router.get('/available-judges', protect, authorize('organizer', 'admin'), getAvailableJudges);
router.get('/:id', getHackathon);

// Organizer / Admin
router.post('/', protect, authorize('organizer', 'admin'), bannerUpload.single('banner'), createHackathon);
router.put('/:id', protect, authorize('organizer', 'admin'), bannerUpload.single('banner'), updateHackathon);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteHackathon);

// Judge management
router.post('/:id/judges', protect, authorize('organizer', 'admin'), assignJudge);
router.delete('/:id/judges/:judgeId', protect, authorize('organizer', 'admin'), removeJudge);

module.exports = router;
