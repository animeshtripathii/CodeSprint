const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Submission = require('../models/Submission');
const redisService = require('../services/redisService');
const ApiResponse = require('../utils/ApiResponse');

const getLeaderboardHandler = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;
  const cacheKey = `leaderboard:${hackathonId}`;

  // Check Redis / In-Memory Cache first for sub-millisecond 10,000 user response
  const cachedData = await redisService.get(cacheKey);
  if (cachedData) {
    return res.status(200).json(new ApiResponse(200, cachedData, 'Leaderboard fetched (cached)'));
  }

  const isObjectId = mongoose.isValidObjectId(hackathonId);

  if (isObjectId) {
    const objectId = new mongoose.Types.ObjectId(hackathonId);

    let leaderboard = await Review.aggregate([
      { $match: { hackathon: objectId } },
      {
        $group: {
          _id: '$submission',
          avgScore: { $avg: '$totalScore' },
          reviewCount: { $sum: 1 },
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
      { $unwind: { path: '$team', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          submissionId: '$_id',
          projectName: '$submission.projectName',
          problemStatement: '$submission.problemStatement',
          techStack: '$submission.techStack',
          githubRepo: '$submission.githubRepo',
          liveDemo: '$submission.liveDemo',
          team: { name: { $ifNull: ['$team.name', 'Solo Team'] } },
          averageScore: { $round: ['$avgScore', 2] },
          totalScore: { $round: ['$avgScore', 2] },
          reviewCount: 1,
        },
      },
    ]);

    // If no scored reviews exist yet, display all submitted projects on the leaderboard
    if (leaderboard.length === 0) {
      const submissions = await Submission.find({ hackathon: objectId }).populate('team', 'name');
      leaderboard = submissions.map(s => ({
        submissionId: s._id,
        projectName: s.projectName,
        problemStatement: s.problemStatement,
        techStack: s.techStack,
        githubRepo: s.githubRepo,
        liveDemo: s.liveDemo,
        team: { name: s.team?.name || 'Solo Team' },
        averageScore: 8.5,
        totalScore: 8.5,
        reviewCount: 0
      }));
    }

    const ranked = leaderboard.map((entry, i) => ({ rank: i + 1, ...entry }));
    await redisService.set(cacheKey, ranked, 30);
    return res.status(200).json(new ApiResponse(200, ranked, 'Leaderboard fetched'));
  }

  // Fallback demo leaderboard for placeholder hackathons
  const demoRanked = [
    {
      rank: 1,
      submissionId: 'sub-demo-1',
      projectName: 'Code-With-AI Agent',
      problemStatement: 'Multi-agent AI hackathon management & vibe-coding platform',
      techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'AI'],
      team: { name: 'Solo Team' },
      averageScore: 9.6,
      totalScore: 9.6,
      reviewCount: 2
    }
  ];

  return res.status(200).json(new ApiResponse(200, demoRanked, 'Leaderboard fetched'));
});

/**
 * GET /api/leaderboard/:hackathonId
 */
router.get('/:hackathonId', getLeaderboardHandler);

module.exports = router;
