const asyncHandler = require('express-async-handler');
const reviewService = require('../services/reviewService');
const ApiResponse = require('../utils/ApiResponse');

const submitReview = asyncHandler(async (req, res) => {
  const review = await reviewService.submitReview(req.user._id, req.params.submissionId, req.body);
  return res.status(201).json(new ApiResponse(201, review, 'Review submitted'));
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.updateReview(req.user._id, req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, review, 'Review updated'));
});

const getReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getReviewsBySubmission(req.params.submissionId, req.user._id);
  return res.status(200).json(new ApiResponse(200, reviews, 'Reviews fetched'));
});

const getHackathonReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getReviewsByHackathon(req.params.hackathonId);
  return res.status(200).json(new ApiResponse(200, reviews, 'Hackathon reviews fetched'));
});

const getAssignedSubmissions = asyncHandler(async (req, res) => {
  const submissions = await reviewService.getAssignedSubmissions(req.user._id);
  return res.status(200).json(new ApiResponse(200, submissions, 'Assigned submissions fetched'));
});

module.exports = { submitReview, updateReview, getReviews, getHackathonReviews, getAssignedSubmissions };
