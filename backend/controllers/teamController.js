const asyncHandler = require('express-async-handler');
const teamService = require('../services/teamService');
const ApiResponse = require('../utils/ApiResponse');

const createTeam = asyncHandler(async (req, res) => {
  const team = await teamService.createTeam(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, team, 'Team created'));
});

const getTeam = asyncHandler(async (req, res) => {
  const team = await teamService.getTeamById(req.params.id);
  return res.status(200).json(new ApiResponse(200, team, 'Team fetched'));
});

const listTeams = asyncHandler(async (req, res) => {
  const result = await teamService.listTeamsByHackathon(req.params.hackathonId, req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Teams fetched'));
});

const addMember = asyncHandler(async (req, res) => {
  const team = await teamService.addMember(req.params.id, req.user._id, req.body.email);
  return res.status(200).json(new ApiResponse(200, team, 'Member added'));
});

const removeMember = asyncHandler(async (req, res) => {
  const team = await teamService.removeMember(req.params.id, req.user._id, req.params.memberId);
  return res.status(200).json(new ApiResponse(200, team, 'Member removed'));
});

const transferLeadership = asyncHandler(async (req, res) => {
  const team = await teamService.transferLeadership(req.params.id, req.user._id, req.body.newLeaderId);
  return res.status(200).json(new ApiResponse(200, team, 'Leadership transferred'));
});

const getWorkspace = asyncHandler(async (req, res) => {
  const data = await teamService.getWorkspace(req.params.id, req.user._id);
  return res.status(200).json(new ApiResponse(200, data, 'Workspace data fetched'));
});

module.exports = { createTeam, getTeam, listTeams, addMember, removeMember, transferLeadership, getWorkspace };
