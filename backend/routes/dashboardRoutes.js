const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/User');
const Hackathon = require('../models/Hackathon');
const Registration = require('../models/Registration');
const Team = require('../models/Team');
const Submission = require('../models/Submission');
const Review = require('../models/Review');

/**
 * GET /api/dashboard/admin
 */
router.get('/admin', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const [totalUsers, totalHackathons, totalSubmissions, usersByRole, hackathonsByStatus] = await Promise.all([
    User.countDocuments(),
    Hackathon.countDocuments(),
    Submission.countDocuments(),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Hackathon.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  return res.status(200).json(new ApiResponse(200, {
    totalUsers, totalHackathons, totalSubmissions, usersByRole, hackathonsByStatus,
  }, 'Admin dashboard'));
}));

/**
 * GET /api/dashboard/organizer
 */
router.get('/organizer', protect, authorize('organizer', 'admin'), asyncHandler(async (req, res) => {
  const hackathons = await Hackathon.find({ organizer: req.user._id })
    .select('title status startDate endDate registrationDeadline prizePool theme mode tags judges')
    .populate('judges', 'name email');

  const hackathonIds = hackathons.map((h) => h._id);

  const [registrationAgg, submissionAgg, reviewCount] = await Promise.all([
    Registration.aggregate([
      { $match: { hackathon: { $in: hackathonIds } } },
      { $group: { _id: '$hackathon', count: { $sum: 1 } } },
    ]),
    Submission.aggregate([
      { $match: { hackathon: { $in: hackathonIds } } },
      { $group: { _id: '$hackathon', count: { $sum: 1 } } },
    ]),
    Review.countDocuments({ hackathon: { $in: hackathonIds } }),
  ]);

  const regMap = Object.fromEntries(registrationAgg.map(r => [r._id.toString(), r.count]));
  const subMap = Object.fromEntries(submissionAgg.map(s => [s._id.toString(), s.count]));

  const hackathonsWithCounts = hackathons.map(h => ({
    ...h.toObject(),
    registrationCount: regMap[h._id.toString()] || 0,
    submissionCount: subMap[h._id.toString()] || 0,
  }));

  const totalRegistrations = registrationAgg.reduce((s, r) => s + r.count, 0);
  const totalSubmissions = submissionAgg.reduce((s, r) => s + r.count, 0);

  return res.status(200).json(new ApiResponse(200, {
    hackathons: hackathonsWithCounts,
    totalHackathons: hackathons.length,
    totalRegistrations,
    totalSubmissions,
    totalReviews: reviewCount,
  }, 'Organizer dashboard'));
}));

/**
 * GET /api/dashboard/participant
 */
router.get('/participant', protect, authorize('participant'), asyncHandler(async (req, res) => {
  const [registrations, teams] = await Promise.all([
    Registration.find({ participant: req.user._id }).populate('hackathon', 'title status startDate endDate banner'),
    Team.find({ members: req.user._id }).populate('hackathon', 'title status'),
  ]);
  const teamIds = teams.map((t) => t._id);
  const submissions = await Submission.find({ team: { $in: teamIds } }).select('projectName status hackathon');
  return res.status(200).json(new ApiResponse(200, { registrations, teams, submissions }, 'Participant dashboard'));
}));

/**
 * GET /api/dashboard/judge
 */
router.get('/judge', protect, authorize('judge'), asyncHandler(async (req, res) => {
  const hackathons = await Hackathon.find({ judges: req.user._id })
    .select('title status startDate endDate theme judgingCriteria');
  const hackathonIds = hackathons.map((h) => h._id);

  // Get all submissions for these hackathons, with team info
  const submissions = await Submission.find({ hackathon: { $in: hackathonIds } })
    .select('projectName problemStatement techStack status hackathon team')
    .populate('team', 'name');

  // Get judge's reviews for these submissions
  const submissionIds = submissions.map(s => s._id);
  const myReviews = await Review.find({ judge: req.user._id, submission: { $in: submissionIds } })
    .select('submission totalScore');

  const reviewedSet = new Map(myReviews.map(r => [r.submission.toString(), r.totalScore]));

  const submissionsWithStatus = submissions.map(s => ({
    ...s.toObject(),
    reviewed: reviewedSet.has(s._id.toString()),
    myScore: reviewedSet.get(s._id.toString()) ?? null,
  }));

  const totalSubmissions = submissions.length;
  const completedReviews = myReviews.length;

  return res.status(200).json(new ApiResponse(200, {
    hackathons,
    submissions: submissionsWithStatus,
    totalSubmissions,
    completedReviews,
    pendingReviews: totalSubmissions - completedReviews,
  }, 'Judge dashboard'));
}));

module.exports = router;
