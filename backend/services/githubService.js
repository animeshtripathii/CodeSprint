const axios = require('axios');
const Team = require('../models/Team');
const ApiError = require('../utils/ApiError');

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Extracts owner and repository name from a GitHub URL
const parseRepoUrl = (url) => {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/);
  if (!match) throw new ApiError(400, 'Invalid GitHub repository URL');
  return { owner: match[1], repo: match[2] };
};

// Converts a list of file paths into a folder tree structure
const buildTree = (flatItems) => {
  const root = {};
  for (const item of flatItems) {
    const parts = item.path.split('/');
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        node[part] = { type: item.type, path: item.path };
      } else {
        if (!node[part]) node[part] = { type: 'tree', children: {} };
        if (!node[part].children) node[part].children = {};
        node = node[part].children;
      }
    }
  }
  return root;
};

// Fetches the file and folder tree of a team repository from GitHub
const getRepoTree = async (teamId, userId, forceRefresh = false) => {
  const team = await Team.findById(teamId);
  if (!team) throw new ApiError(404, 'Team not found');

  const isMember = team.members.some(
    (m) => (m._id ? m._id.toString() : m.toString()) === userId.toString()
  );
  if (!isMember) throw new ApiError(403, 'Not a team member');

  if (!team.githubRepo) throw new ApiError(400, 'No GitHub repository linked to this team');

  // Returns cached file tree if it is fresh
  if (
    !forceRefresh &&
    team.repoTree &&
    team.repoTreeFetchedAt &&
    Date.now() - new Date(team.repoTreeFetchedAt).getTime() < CACHE_TTL_MS
  ) {
    return { tree: team.repoTree, cached: true };
  }

  const { owner, repo } = parseRepoUrl(team.githubRepo);

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'CodeSprint-App',
    ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
  };

  try {
    const repoRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    const defaultBranch = repoRes.data.default_branch || 'main';

    const treeRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers }
    );

    const flatItems = (treeRes.data.tree || []).filter((item) => item.type === 'blob' || item.type === 'tree');
    const nestedTree = buildTree(flatItems);

    await Team.findByIdAndUpdate(teamId, {
      repoTree: nestedTree,
      repoTreeFetchedAt: new Date(),
    });

    return { tree: nestedTree, cached: false };
  } catch (err) {
    console.error('GitHub API error in getRepoTree:', err.message);
    if (err.response?.status === 404) {
      throw new ApiError(404, 'Repository not found. Please ensure it is a public GitHub repository.');
    }
    if (err.response?.status === 403) {
      throw new ApiError(403, 'GitHub API rate limit reached or access forbidden.');
    }
    throw new ApiError(500, err.message || 'Failed to fetch repository tree from GitHub');
  }
};

// Updates the team's linked GitHub repository URL
const setRepoUrl = async (teamId, leaderId, githubRepo) => {
  const team = await Team.findById(teamId);
  if (!team) throw new ApiError(404, 'Team not found');
  if (team.leader.toString() !== leaderId.toString()) {
    throw new ApiError(403, 'Only team leader can set the repository URL');
  }
  // Validate URL format before saving
  parseRepoUrl(githubRepo);
  await Team.findByIdAndUpdate(teamId, { githubRepo, repoTree: null, repoTreeFetchedAt: null });
  return { githubRepo };
};

module.exports = { getRepoTree, setRepoUrl };
