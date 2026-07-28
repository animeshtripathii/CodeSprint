const asyncHandler = require('express-async-handler');
const teamService = require('../services/teamService');
const ApiResponse = require('../utils/ApiResponse');
const Team = require('../models/Team');

const createTeam = asyncHandler(async (req, res) => {
  const team = await teamService.createTeam(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, team, 'Team created'));
});

const getTeam = asyncHandler(async (req, res) => {
  const team = await teamService.getTeamById(req.params.id);
  return res.status(200).json(new ApiResponse(200, team, 'Team fetched'));
});

// Lookup a team by its invite code (e.g. TEAM-ABC123)
// The code is derived from the last 6 chars of the MongoDB _id
const getTeamByCode = asyncHandler(async (req, res) => {
  const code = (req.params.code || '').replace(/^TEAM-/i, '').toUpperCase();
  // Find teams whose _id ends with the code (case-insensitive suffix match)
  const teams = await Team.find({}).populate('leader members', 'name email avatar').populate('hackathon', 'title maxTeamSize status');
  const match = teams.find(t => t._id.toString().slice(-6).toUpperCase() === code);
  if (!match) return res.status(404).json({ success: false, message: 'No team found with that code' });
  return res.status(200).json(new ApiResponse(200, match, 'Team found'));
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

// Self-join via invite link (no leader required)
const selfJoin = asyncHandler(async (req, res) => {
  const team = await teamService.selfJoin(req.params.id, req.user._id);
  return res.status(200).json(new ApiResponse(200, team, 'Joined team successfully'));
});

module.exports = { createTeam, getTeam, listTeams, addMember, removeMember, transferLeadership, getWorkspace, selfJoin, getTeamByCode };
