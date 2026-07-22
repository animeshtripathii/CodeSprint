const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Submission = require('../models/Submission');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * GET /api/leaderboard/:hackathonId
 * Aggregates review scores per submission, ranks them
 */
router.get('/:hackathonId', asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  const leaderboard = await Review.aggregate([
    { $match: { hackathon: new (require('mongoose').Types.ObjectId)(hackathonId) } },
    {
      $group: {
        _id: '$submission',
        avgScore: { $avg: '$totalScore' },
        reviewCount: { $sum: 1 },
        judges: { $push: '$judge' },
      },
    },
    { $sort: { avgScore: -1 } },
    {
      $lookup: {
        from: 'submissions',
        localField: '_id',
        foreignField: '_id',
        as: 'submission',
      },
    },
    { $unwind: '$submission' },
    {
      $lookup: {
        from: 'teams',
        localField: 'submission.team',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    {
      $project: {
        _id: 0,
        submissionId: '$_id',
        projectName: '$submission.projectName',
        aiSummary: '$submission.aiSummary',
        techStack: '$submission.techStack',
        githubRepo: '$submission.githubRepo',
        liveDemo: '$submission.liveDemo',
        teamName: '$team.name',
        teamId: '$team._id',
        avgScore: { $round: ['$avgScore', 2] },
        reviewCount: 1,
      },
    },
  ]);

  // Add rank
  const ranked = leaderboard.map((entry, i) => ({ rank: i + 1, ...entry }));

  return res.status(200).json(new ApiResponse(200, ranked, 'Leaderboard fetched'));
}));

module.exports = router;
