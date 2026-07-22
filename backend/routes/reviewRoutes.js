const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { submitReview, updateReview, getReviews, getAssignedSubmissions } = require('../controllers/reviewController');

router.get('/assigned', protect, authorize('judge'), getAssignedSubmissions);
router.post('/submission/:submissionId', protect, authorize('judge'), submitReview);
router.get('/submission/:submissionId', protect, getReviews);
router.put('/:id', protect, authorize('judge'), updateReview);

module.exports = router;
