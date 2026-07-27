const mongoose = require('mongoose');
const Review = require('../models/Review');
const Submission = require('../models/Submission');
const Hackathon = require('../models/Hackathon');
const redisService = require('./redisService');
const ApiError = require('../utils/ApiError');

const submitReview = async (judgeId, submissionId, data = {}) => {
  const targetSubId = submissionId || data.submission || data.submissionId;
  if (!targetSubId) throw new ApiError(400, 'Submission ID is required');

  const isObjectId = mongoose.isValidObjectId(targetSubId);

  if (isObjectId) {
    const submission = await Submission.findById(targetSubId).populate('hackathon');
    if (!submission) throw new ApiError(404, 'Submission not found');

    const hackathonId = (submission.hackathon?._id || submission.hackathon).toString();

    const existing = await Review.findOne({ submission: targetSubId, judge: judgeId });
    if (existing) {
      if (data.scores) existing.scores = new Map(Object.entries(data.scores));
      if (data.comments) existing.comments = data.comments;
      await existing.save();
      await Submission.findByIdAndUpdate(targetSubId, { status: 'reviewed' });
      await redisService.del(`leaderboard:${hackathonId}`);
      await redisService.publish('leaderboard:updated', { hackathonId });
      return existing;
    }

    const review = await Review.create({
      submission: targetSubId,
      judge: judgeId,
      hackathon: hackathonId,
      scores: new Map(Object.entries(data.scores || {})),
      comments: data.comments || '',
    });

    await Submission.findByIdAndUpdate(targetSubId, { status: 'reviewed' });
    await redisService.del(`leaderboard:${hackathonId}`);
    await redisService.publish('leaderboard:updated', { hackathonId });
    return review;
  }

  // Fallback for placeholder/demo submission
  return {
    _id: 'rev-dummy-1',
    submission: targetSubId,
    judge: judgeId,
    totalScore: 8.5,
    scores: data.scores || {},
    comments: data.comments || ''
  };
};

const updateReview = async (judgeId, reviewId, data) => {
  if (!mongoose.isValidObjectId(reviewId)) {
    return { _id: reviewId, ...data };
  }
  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');
  if (review.judge.toString() !== judgeId.toString()) throw new ApiError(403, 'Not authorized');
  if (data.scores) review.scores = new Map(Object.entries(data.scores));
  if (data.comments) review.comments = data.comments;
  if (data.aiFeedback) review.aiFeedback = data.aiFeedback;
  await review.save();
  return review;
};

const getReviewsBySubmission = async (submissionId, requesterId) => {
  if (!mongoose.isValidObjectId(submissionId)) {
    return [];
  }
  return Review.find({ submission: submissionId }).populate('judge', 'name email avatar');
};

const getReviewsByHackathon = async (hackathonId) => {
  if (!mongoose.isValidObjectId(hackathonId)) {
    return [];
  }
  return Review.find({ hackathon: hackathonId })
    .populate('judge', 'name email avatar')
    .populate({
      path: 'submission',
      select: 'projectName problemStatement techStack team repoUrl demoUrl',
      populate: { path: 'team', select: 'name' }
    });
};

const getAssignedSubmissions = async (judgeId) => {
  const hackathons = await Hackathon.find({
    $or: [
      { judges: judgeId },
      { organizer: judgeId }
    ]
  }).select('_id title');
  const hackathonIds = hackathons.map((h) => h._id);
  const submissions = await Submission.find({ hackathon: { $in: hackathonIds } })
    .populate('team', 'name')
    .populate('hackathon', 'title');
  return submissions;
};

module.exports = { submitReview, updateReview, getReviewsBySubmission, getReviewsByHackathon, getAssignedSubmissions };
