import { Router } from 'express';
import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import Board from '../models/Board.js';
import { requireAuth } from '../middleware/auth.js';
import { io } from '../index.js';

const router = Router();
router.use(requireAuth);

// GET /api/comments/:taskId — Get all comments for a task
router.get('/:taskId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const board = await Board.findOne({
      _id: task.boardId,
      'members.userId': req.user._id,
    });
    if (!board) return res.status(403).json({ error: 'Access denied' });

    const comments = await Comment.find({ taskId: task._id })
      .populate('userId', 'name email avatarUrl')
      .sort({ createdAt: 1 })
      .lean();

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/comments/:taskId — Post a comment on a task
router.post('/:taskId', async (req, res) => {
  try {
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: 'Comment body is required' });

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const board = await Board.findOne({
      _id: task.boardId,
      'members.userId': req.user._id,
    });
    if (!board) return res.status(403).json({ error: 'Access denied' });

    const comment = await Comment.create({
      taskId: task._id,
      userId: req.user._id,
      body,
    });

    const populated = await Comment.findById(comment._id)
      .populate('userId', 'name email avatarUrl')
      .lean();

    // Log comment in task activity log
    task.activityLog.push({
      userId: req.user._id,
      action: `commented: "${body.substring(0, 30)}${body.length > 30 ? '...' : ''}"`,
      timestamp: new Date(),
    });
    await task.save();

    // Broadcast update so task drawer updates details
    io.to(task.boardId.toString()).emit('comment:created', populated);
    io.to(task.boardId.toString()).emit('task:updated', await Task.findById(task._id).populate('assigneeId', 'name email avatarUrl').lean());

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
