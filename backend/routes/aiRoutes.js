const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/auth');
const aiService = require('../services/aiService');
const taskService = require('../services/taskService');
const Submission = require('../models/Submission');
const Team = require('../models/Team');
const Task = require('../models/Task');
const ApiResponse = require('../utils/ApiResponse');

// Basic rate limiting for AI routes (max 20 req/min per user)
const aiRequestCounts = new Map();
const rateLimit = (req, res, next) => {
  const key = req.user._id.toString();
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 20;
  if (!aiRequestCounts.has(key)) aiRequestCounts.set(key, []);
  const requests = aiRequestCounts.get(key).filter((t) => now - t < windowMs);
  if (requests.length >= max) {
    return res.status(429).json({ success: false, message: 'Too many AI requests. Try again in a minute.' });
  }
  requests.push(now);
  aiRequestCounts.set(key, requests);
  next();
};

/**
 * POST /api/ai/validate-idea
 */
router.post('/validate-idea', protect, rateLimit, asyncHandler(async (req, res) => {
  const result = await aiService.validateIdea(req.body);
  return res.status(200).json(new ApiResponse(200, result, 'Idea validated'));
}));

/**
 * POST /api/ai/summarize/:submissionId
 */
router.post('/summarize/:submissionId', protect, rateLimit, asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.submissionId);
  if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

  const summary = await aiService.summarizeSubmission({
    projectName: submission.projectName,
    problemStatement: submission.problemStatement,
    solution: submission.solution,
    techStack: submission.techStack,
  });

  submission.aiSummary = summary;
  await submission.save();

  return res.status(200).json(new ApiResponse(200, { summary }, 'Summary generated'));
}));

/**
 * POST /api/ai/generate-tasks
 */
router.post('/generate-tasks', protect, rateLimit, asyncHandler(async (req, res) => {
  const { teamId, projectIdea, hackathonTheme } = req.body;
  const team = await Team.findById(teamId).populate('hackathon');
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  const generatedTasks = await aiService.generateTasks({
    projectIdea,
    hackathonTheme: hackathonTheme || team.hackathon?.theme,
    teamSize: team.members.length,
  });

  // Bulk create tasks in DB
  const createdTasks = await taskService.bulkCreateTasks(req.user._id, teamId, generatedTasks);

  // Emit real-time update
  const io = req.app.get('io');
  if (io) io.to(teamId).emit('tasks:bulk-created', createdTasks);

  return res.status(201).json(new ApiResponse(201, { tasks: createdTasks, generated: generatedTasks }, 'Tasks generated'));
}));

/**
 * POST /api/ai/judge-feedback/:reviewId
 */
router.post('/judge-feedback/:reviewId', protect, rateLimit, asyncHandler(async (req, res) => {
  const Review = require('../models/Review');
  const review = await Review.findById(req.params.reviewId).populate('submission');
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  const scoresObj = {};
  if (review.scores instanceof Map) {
    review.scores.forEach((v, k) => (scoresObj[k] = v));
  } else {
    Object.assign(scoresObj, review.scores);
  }

  const feedback = await aiService.generateJudgeFeedback({
    projectName: review.submission?.projectName || 'Unknown Project',
    scores: scoresObj,
    rawComments: review.comments,
  });

  review.aiFeedback = feedback;
  await review.save();

  return res.status(200).json(new ApiResponse(200, { feedback }, 'Feedback generated'));
}));

/**
 * POST /api/ai/chat/:teamId  — @ai chat assistant
 */
router.post('/chat/:teamId', protect, rateLimit, asyncHandler(async (req, res) => {
  const { message } = req.body;
  const team = await Team.findById(req.params.teamId)
    .populate('hackathon', 'title theme')
    .populate('members', 'name');

  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  const tasks = await Task.find({ team: req.params.teamId });
  const done = tasks.filter((t) => t.status === 'done').length;
  const taskSummary = `${done}/${tasks.length} tasks done`;
  const Submission = require('../models/Submission');
  const sub = await Submission.findOne({ team: req.params.teamId });

  const response = await aiService.chatAssistant({
    message,
    teamContext: {
      teamName: team.name,
      hackathonTitle: team.hackathon?.title || 'Unknown Hackathon',
      taskSummary,
      submissionStatus: sub?.status || 'Not submitted',
    },
  });

  // Save AI message to chat
  const Message = require('../models/Message');
  const aiMsg = await Message.create({
    team: req.params.teamId,
    sender: req.user._id,
    text: `🤖 **AI:** ${response}`,
    isAiMessage: true,
  });
  await aiMsg.populate('sender', 'name avatar');

  const io = req.app.get('io');
  if (io) io.to(req.params.teamId).emit('message:new', aiMsg);

  return res.status(200).json(new ApiResponse(200, { response, message: aiMsg }, 'AI response'));
}));

/**
 * GET /api/ai/board-summary/:teamId
 */
router.get('/board-summary/:teamId', protect, rateLimit, asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId).select('name');
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  const tasks = await Task.find({ team: req.params.teamId });
  const now = new Date();
  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };
  const overdueTasks = tasks
    .filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done')
    .map((t) => ({ title: t.title, dueDate: t.dueDate }));

  const summary = await aiService.boardSummary({ teamName: team.name, taskStats, overdueTasks });
  return res.status(200).json(new ApiResponse(200, { summary, taskStats, overdueTasks }, 'Board summary'));
}));

module.exports = router;
