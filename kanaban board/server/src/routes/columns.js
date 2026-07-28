import { Router } from 'express';
import Column from '../models/Column.js';
import Task from '../models/Task.js';
import Board from '../models/Board.js';
import { requireAuth } from '../middleware/auth.js';
import { io } from '../index.js';
import { updateUserStats, isDoneColumn } from '../services/userStats.js';

const router = Router();
router.use(requireAuth);

// PATCH /api/columns/:id — rename or reposition a column
router.patch('/:id', async (req, res) => {
  try {
    const column = await Column.findById(req.params.id);
    if (!column) return res.status(404).json({ error: 'Column not found' });

    // Verify board membership
    const board = await Board.findOne({
      _id: column.boardId,
      'members.userId': req.user._id,
    });
    if (!board) return res.status(403).json({ error: 'Access denied' });

    const { title, position } = req.body;
    if (title !== undefined) column.title = title;
    if (position !== undefined) column.position = position;
    await column.save();

    const event = title !== undefined ? 'column:renamed' : 'column:reordered';
    io.to(column.boardId.toString()).emit(event, column);
    res.json(column);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/columns/:id
router.delete('/:id', async (req, res) => {
  try {
    const column = await Column.findById(req.params.id);
    if (!column) return res.status(404).json({ error: 'Column not found' });

    const board = await Board.findOne({
      _id: column.boardId,
      'members.userId': req.user._id,
    });
    if (!board) return res.status(403).json({ error: 'Access denied' });

    const affectedAssignees = await Task.find({ columnId: column._id }).distinct('assigneeId');

    await Task.deleteMany({ columnId: column._id });
    await column.deleteOne();

    for (const uid of affectedAssignees) {
      if (uid) await updateUserStats(uid);
    }

    io.to(column.boardId.toString()).emit('column:deleted', { columnId: column._id.toString(), id: column._id.toString() });
    res.json({ message: 'Column deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/columns/:id/tasks — create a task in a column
router.post('/:id/tasks', async (req, res) => {
  try {
    const column = await Column.findById(req.params.id);
    if (!column) return res.status(404).json({ error: 'Column not found' });

    const board = await Board.findOne({
      _id: column.boardId,
      'members.userId': req.user._id,
    });
    if (!board) return res.status(403).json({ error: 'Access denied' });

    const lastTask = await Task.findOne({ columnId: column._id }).sort({ position: -1 });
    const position = lastTask ? lastTask.position + 1 : 0;

    const isDone = await isDoneColumn(column._id);

    const task = await Task.create({
      boardId: column.boardId,
      columnId: column._id,
      title: req.body.title || 'Untitled task',
      description: req.body.description || '',
      priority: req.body.priority || 'medium',
      dueDate: req.body.dueDate || null,
      assigneeId: req.body.assigneeId || null,
      position,
      completedAt: isDone ? new Date() : null,
      activityLog: [
        {
          userId: req.user._id,
          action: `created this task`,
          timestamp: new Date(),
        },
      ],
    });

    if (task.assigneeId) {
      await updateUserStats(task.assigneeId);
    }

    let populated = await Task.findById(task._id)
      .populate('assigneeId', 'name email avatarUrl')
      .lean();

    const assignee = populated.assigneeId;
    if (assignee) {
      populated.assigneeId = assignee._id;
      populated.assigneeName = assignee.name;
      populated.assigneeEmail = assignee.email;
      populated.assigneeAvatar = assignee.avatarUrl;
    }

    io.to(column.boardId.toString()).emit('task:created', populated);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
