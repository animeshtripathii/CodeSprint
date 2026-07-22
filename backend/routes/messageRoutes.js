const asyncHandler = require('express-async-handler');
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Message = require('../models/Message');
const Team = require('../models/Team');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * POST /api/messages/:teamId  — send a message
 */
router.post('/:teamId', protect, asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId);
  if (!team) throw new ApiError(404, 'Team not found');
  const isMember = team.members.map((m) => m.toString()).includes(req.user._id.toString());
  if (!isMember) throw new ApiError(403, 'Not a team member');

  const message = await Message.create({
    team: req.params.teamId,
    sender: req.user._id,
    text: req.body.text,
  });

  await message.populate('sender', 'name avatar');

  // Broadcast to team room via Socket.io
  const io = req.app.get('io');
  if (io) io.to(req.params.teamId).emit('message:new', message);

  return res.status(201).json(new ApiResponse(201, message, 'Message sent'));
}));

/**
 * GET /api/messages/:teamId?page=1&limit=50  — paginated chat history
 */
router.get('/:teamId', protect, asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId);
  if (!team) throw new ApiError(404, 'Team not found');
  const isMember = team.members.map((m) => m.toString()).includes(req.user._id.toString());
  if (!isMember) throw new ApiError(403, 'Not a team member');

  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ team: req.params.teamId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Message.countDocuments({ team: req.params.teamId }),
  ]);

  return res.status(200).json(new ApiResponse(200, {
    messages: messages.reverse(), // return oldest-first for chat display
    total, page: Number(page), pages: Math.ceil(total / limit),
  }, 'Messages fetched'));
}));

module.exports = router;
