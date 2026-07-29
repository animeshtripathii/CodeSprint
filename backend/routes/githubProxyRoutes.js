const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const axios = require('axios');
const { protect } = require('../middleware/auth');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// Shared GitHub headers — always use the server token to avoid rate limits
const githubHeaders = () => ({
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(process.env.GITHUB_TOKEN && {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  }),
});

// ── GET /api/github/repos/:username ─────────────────────────────────────────
// Proxy for public repo listing — avoids client-side rate limiting (60 req/hr)
// Authenticated server token gets 5 000 req/hr instead.
router.get('/repos/:username', protect, asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username) throw new ApiError(400, 'GitHub username is required');

  const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos`;
  const ghRes = await axios.get(url, {
    headers: githubHeaders(),
    params: { sort: 'updated', per_page: 100, type: 'public' },
  });

  return res.status(200).json(
    new ApiResponse(200, ghRes.data, 'Repositories fetched')
  );
}));

// ── GET /api/github/user/:username ───────────────────────────────────────────
// Proxy for GitHub user profile info (avatar, bio, followers, etc.)
router.get('/user/:username', protect, asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username) throw new ApiError(400, 'GitHub username is required');

  const ghRes = await axios.get(
    `https://api.github.com/users/${encodeURIComponent(username)}`,
    { headers: githubHeaders() }
  );

  return res.status(200).json(
    new ApiResponse(200, ghRes.data, 'GitHub user fetched')
  );
}));

module.exports = router;
