const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createUploader } = require('../config/cloudinary');
const { createSubmission, updateSubmission, getSubmission, listSubmissions, getMySubmission } = require('../controllers/submissionController');

const screenshotUpload = createUploader('submissions', ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'pptx', 'ppt']);

router.post('/', protect, authorize('participant'),
  screenshotUpload.fields([{ name: 'screenshots', maxCount: 5 }, { name: 'ppt', maxCount: 1 }]),
  createSubmission
);
router.put('/:id', protect, authorize('participant'), updateSubmission);
router.get('/hackathon/:hackathonId', protect, listSubmissions);
router.get('/my/:hackathonId', protect, authorize('participant'), getMySubmission);
router.get('/:id', protect, getSubmission);

module.exports = router;
