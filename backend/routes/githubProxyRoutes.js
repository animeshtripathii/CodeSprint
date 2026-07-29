const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const axios = require('axios');
const { protect } = require('../middleware/auth');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// Creates HTTP headers with GitHub authorization token
const githubHeaders = () => ({
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(process.env.GITHUB_TOKEN && {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  }),
});

// Fetches public GitHub repositories for a given username
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

// Fetches GitHub user profile details for a given username
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
