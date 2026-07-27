const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { submitReview, updateReview, getReviews, getHackathonReviews, getAssignedSubmissions } = require('../controllers/reviewController');

router.get('/assigned', protect, getAssignedSubmissions);
router.post('/', protect, submitReview);
router.post('/submission/:submissionId', protect, submitReview);
router.get('/submission/:submissionId', protect, getReviews);
router.get('/hackathon/:hackathonId', protect, getHackathonReviews);
router.put('/:id', protect, updateReview);

module.exports = router;
