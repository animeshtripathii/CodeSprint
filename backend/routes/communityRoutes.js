const asyncHandler = require('express-async-handler');
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const CommunityMessage = require('../models/CommunityMessage');
const Hackathon = require('../models/Hackathon');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * POST /api/community/:hackathonId/messages — send a community or judge lounge message
 */
router.post('/:hackathonId/messages', protect, asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;
  const { text, channel = 'general' } = req.body;

  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) throw new ApiError(404, 'Hackathon not found');

  const isOrganizer = hackathon.organizer.toString() === req.user._id.toString() || req.user.role === 'admin';
  const isJudge = (hackathon.judges || []).map(j => j.toString()).includes(req.user._id.toString());

  // Enforce channel permissions
  if (channel === 'announcements' && !isOrganizer) {
    throw new ApiError(403, 'Only the hackathon organizer can post announcements');
  }
  if (channel === 'judges' && !isOrganizer && !isJudge) {
    throw new ApiError(403, 'Only judges and organizers can access the Judges Lounge');
  }

  const message = await CommunityMessage.create({
    hackathon: hackathonId,
    sender: req.user._id,
    channel,
    text,
  });

  await message.populate('sender', 'name avatar role');

  // Broadcast real-time socket event to hackathon/judge rooms
  const io = req.app.get('io');
  if (io) {
    if (channel === 'judges') {
      io.to(`judge_${hackathonId}`).emit('judge:new', message);
    } else {
      io.to(`hackathon_${hackathonId}`).emit('community:new', message);
    }
  }

  return res.status(201).json(new ApiResponse(201, message, 'Message sent successfully'));
}));

/**
 * GET /api/community/:hackathonId/messages?channel=general — fetch community chat history
 */
router.get('/:hackathonId/messages', protect, asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;
  const { channel = 'general', page = 1, limit = 50 } = req.query;

  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) throw new ApiError(404, 'Hackathon not found');

  const isOrganizer = hackathon.organizer.toString() === req.user._id.toString() || req.user.role === 'admin';
  const isJudge = (hackathon.judges || []).map(j => j.toString()).includes(req.user._id.toString());

  if (channel === 'judges' && !isOrganizer && !isJudge) {
    throw new ApiError(403, 'Only judges and organizers can view the Judges Lounge');
  }

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    CommunityMessage.find({ hackathon: hackathonId, channel })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    CommunityMessage.countDocuments({ hackathon: hackathonId, channel }),
  ]);

  return res.status(200).json(new ApiResponse(200, {
    messages: messages.reverse(),
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  }, 'Community messages fetched'));
}));

module.exports = router;
