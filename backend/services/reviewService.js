const Review = require('../models/Review');
const Submission = require('../models/Submission');
const Hackathon = require('../models/Hackathon');
const ApiError = require('../utils/ApiError');

const submitReview = async (judgeId, submissionId, { scores, comments }) => {
  const submission = await Submission.findById(submissionId).populate('hackathon');
  if (!submission) throw new ApiError(404, 'Submission not found');

  const hackathon = await Hackathon.findById(submission.hackathon);
  const isAssigned = hackathon.judges.map((j) => j.toString()).includes(judgeId.toString());
  if (!isAssigned) throw new ApiError(403, 'You are not assigned to judge this hackathon');

  const existing = await Review.findOne({ submission: submissionId, judge: judgeId });
  if (existing) throw new ApiError(409, 'You have already reviewed this submission');

  const review = await Review.create({
    submission: submissionId,
    judge: judgeId,
    hackathon: submission.hackathon._id,
    scores: new Map(Object.entries(scores)),
    comments,
  });

  // Update submission status
  await Submission.findByIdAndUpdate(submissionId, { status: 'under_review' });

  return review;
};

const updateReview = async (judgeId, reviewId, data) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');
  if (review.judge.toString() !== judgeId.toString()) throw new ApiError(403, 'Not authorized');
  if (data.scores) review.scores = new Map(Object.entries(data.scores));
  if (data.comments) review.comments = data.comments;
  if (data.aiFeedback) review.aiFeedback = data.aiFeedback;
  await review.save(); // pre-save hook recalculates totalScore
  return review;
};

const getReviewsBySubmission = async (submissionId, requesterId) => {
  const submission = await Submission.findById(submissionId).populate('hackathon');
  if (!submission) throw new ApiError(404, 'Submission not found');
  return Review.find({ submission: submissionId }).populate('judge', 'name email avatar');
};

const getAssignedSubmissions = async (judgeId) => {
  const hackathons = await Hackathon.find({ judges: judgeId }).select('_id title');
  const hackathonIds = hackathons.map((h) => h._id);
  const submissions = await Submission.find({ hackathon: { $in: hackathonIds } })
    .populate('team', 'name')
    .populate('hackathon', 'title');
  return submissions;
};

module.exports = { submitReview, updateReview, getReviewsBySubmission, getAssignedSubmissions };
