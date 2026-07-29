const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/auth');
const githubService = require('../services/githubService');
const ApiResponse = require('../utils/ApiResponse');

// GET /api/teams/:teamId/repo-tree
router.get('/:teamId/repo-tree', protect, asyncHandler(async (req, res) => {
  const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
  const result = await githubService.getRepoTree(req.params.teamId, req.user._id, forceRefresh);
  return res.status(200).json(new ApiResponse(200, result, 'Repo tree fetched'));
}));

// PATCH /api/teams/:teamId/repo-url  — set repo URL (leader only)
router.patch('/:teamId/repo-url', protect, asyncHandler(async (req, res) => {
  const result = await githubService.setRepoUrl(req.params.teamId, req.user._id, req.body.githubRepo);
  return res.status(200).json(new ApiResponse(200, result, 'Repo URL updated'));
}));

module.exports = router;
