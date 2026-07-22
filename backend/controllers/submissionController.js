const asyncHandler = require('express-async-handler');
const submissionService = require('../services/submissionService');
const ApiResponse = require('../utils/ApiResponse');

const createSubmission = asyncHandler(async (req, res) => {
  const submission = await submissionService.createSubmission(req.user._id, req.body, req.files);
  return res.status(201).json(new ApiResponse(201, submission, 'Submission created'));
});

const updateSubmission = asyncHandler(async (req, res) => {
  const submission = await submissionService.updateSubmission(req.params.id, req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, submission, 'Submission updated'));
});

const getSubmission = asyncHandler(async (req, res) => {
  const submission = await submissionService.getSubmissionById(req.params.id);
  return res.status(200).json(new ApiResponse(200, submission, 'Submission fetched'));
});

const listSubmissions = asyncHandler(async (req, res) => {
  const result = await submissionService.listSubmissionsByHackathon(req.params.hackathonId, req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Submissions fetched'));
});

const getMySubmission = asyncHandler(async (req, res) => {
  const result = await submissionService.getMyTeamSubmission(req.user._id, req.params.hackathonId);
  return res.status(200).json(new ApiResponse(200, result, 'Submission fetched'));
});

module.exports = { createSubmission, updateSubmission, getSubmission, listSubmissions, getMySubmission };
