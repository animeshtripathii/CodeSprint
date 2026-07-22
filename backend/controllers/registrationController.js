const asyncHandler = require('express-async-handler');
const registrationService = require('../services/registrationService');
const ApiResponse = require('../utils/ApiResponse');

const register = asyncHandler(async (req, res) => {
  const reg = await registrationService.registerForHackathon(req.user._id, req.body.hackathonId);
  return res.status(201).json(new ApiResponse(201, reg, 'Registered successfully'));
});

const cancel = asyncHandler(async (req, res) => {
  const reg = await registrationService.cancelRegistration(req.user._id, req.params.hackathonId);
  return res.status(200).json(new ApiResponse(200, reg, 'Registration cancelled'));
});

const listByHackathon = asyncHandler(async (req, res) => {
  const result = await registrationService.listRegistrationsByHackathon(req.params.hackathonId, req.user._id, req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Registrations fetched'));
});

const updateStatus = asyncHandler(async (req, res) => {
  const reg = await registrationService.updateRegistrationStatus(req.params.id, req.body.status, req.user._id);
  return res.status(200).json(new ApiResponse(200, reg, 'Status updated'));
});

const getMyRegistrations = asyncHandler(async (req, res) => {
  const regs = await registrationService.getMyRegistrations(req.user._id);
  return res.status(200).json(new ApiResponse(200, regs, 'My registrations fetched'));
});

module.exports = { register, cancel, listByHackathon, updateStatus, getMyRegistrations };
