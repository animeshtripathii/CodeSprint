const asyncHandler = require('express-async-handler');
const hackathonService = require('../services/hackathonService');
const ApiResponse = require('../utils/ApiResponse');

// Fetches list of all hackathons
const listHackathons = asyncHandler(async (req, res) => {
  const result = await hackathonService.listHackathons(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Hackathons fetched'));
});

// Fetches details of a single hackathon by ID
const getHackathon = asyncHandler(async (req, res) => {
  const hackathon = await hackathonService.getHackathonById(req.params.id);
  return res.status(200).json(new ApiResponse(200, hackathon, 'Hackathon fetched'));
});

// Creates a new hackathon with optional banner image upload
const createHackathon = asyncHandler(async (req, res) => {
  if (req.file) req.body.banner = req.file.path;
  const hackathon = await hackathonService.createHackathon(req.body, req.user._id);
  return res.status(201).json(new ApiResponse(201, hackathon, 'Hackathon created'));
});

// Updates an existing hackathon details
const updateHackathon = asyncHandler(async (req, res) => {
  if (req.file) req.body.banner = req.file.path;
  const hackathon = await hackathonService.updateHackathon(req.params.id, req.body, req.user._id, req.user.role);
  return res.status(200).json(new ApiResponse(200, hackathon, 'Hackathon updated'));
});

// Deletes a hackathon from the system
const deleteHackathon = asyncHandler(async (req, res) => {
  await hackathonService.deleteHackathon(req.params.id, req.user._id, req.user.role);
  return res.status(200).json(new ApiResponse(200, {}, 'Hackathon deleted'));
});

// Fetches list of available judges for hackathons
const getAvailableJudges = asyncHandler(async (req, res) => {
  const judges = await hackathonService.getAvailableJudges();
  return res.status(200).json(new ApiResponse(200, judges, 'Available judges fetched'));
});

// Assigns a judge to a specific hackathon
const assignJudge = asyncHandler(async (req, res) => {
  const hackathon = await hackathonService.assignJudge(req.params.id, req.body.judgeId, req.user._id);
  return res.status(200).json(new ApiResponse(200, hackathon, 'Judge assigned'));
});

// Removes a judge from a specific hackathon
const removeJudge = asyncHandler(async (req, res) => {
  const hackathon = await hackathonService.removeJudge(req.params.id, req.params.judgeId, req.user._id);
  return res.status(200).json(new ApiResponse(200, hackathon, 'Judge removed'));
});

module.exports = {
  listHackathons, getHackathon, createHackathon, updateHackathon,
  deleteHackathon, getAvailableJudges, assignJudge, removeJudge
};
