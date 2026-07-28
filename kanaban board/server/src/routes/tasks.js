import { Router } from 'express';
import Task from '../models/Task.js';
import Board from '../models/Board.js';
import WorkloadAction from '../models/WorkloadAction.js';
import { requireAuth } from '../middleware/auth.js';
import { io } from '../index.js';
import { updateUserStats, isDoneColumn } from '../services/userStats.js';
import { createAndSendNotification } from '../services/notification.js';

const router = Router();
router.use(requireAuth);

// PATCH /api/tasks/:id — Update task details or move task
router.patch('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Verify board access
    const board = await Board.findOne({
      _id: task.boardId,
      'members.userId': req.user._id,
    });
    if (!board) return res.status(403).json({ error: 'Access denied' });

    const oldAssigneeId = task.assigneeId;
    const oldColumnId = task.columnId;

    const {
      title,
      description,
      columnId,
      position,
      priority,
      dueDate,
      assigneeId,
      labelIds,
      subtasks,
    } = req.body;

    const activity = [];
    const updates = {};

    if (title !== undefined && title !== task.title) {
      updates.title = title;
      activity.push({ userId: req.user._id, action: `renamed task to "${title}"` });
    }

    if (description !== undefined && description !== task.description) {
      updates.description = description;
      activity.push({ userId: req.user._id, action: `updated description` });
    }

    if (priority !== undefined && priority !== task.priority) {
      updates.priority = priority;
      activity.push({ userId: req.user._id, action: `changed priority to ${priority}` });
    }

    if (dueDate !== undefined && String(dueDate) !== String(task.dueDate)) {
      updates.dueDate = dueDate;
      activity.push({ userId: req.user._id, action: dueDate ? `set due date to ${new Date(dueDate).toLocaleDateString()}` : `removed due date` });
    }

    if (assigneeId !== undefined && String(assigneeId) !== String(task.assigneeId)) {
      updates.assigneeId = assigneeId;
      activity.push({ userId: req.user._id, action: assigneeId ? `assigned task` : `unassigned task` });
    }

    if (labelIds !== undefined) {
      updates.labelIds = labelIds;
      activity.push({ userId: req.user._id, action: `updated labels` });
    }

    if (subtasks !== undefined) {
      updates.subtasks = subtasks;
      // Simple check to log completions or additions
      if (subtasks.length !== task.subtasks.length) {
        activity.push({ userId: req.user._id, action: `updated checklist items` });
      } else {
        const completedCountTask = task.subtasks.filter(s => s.completed).length;
        const completedCountBody = subtasks.filter(s => s.completed).length;
        if (completedCountTask !== completedCountBody) {
          activity.push({ userId: req.user._id, action: `updated checklist progress` });
        }
      }
    }

    // Move behavior (column/position changes)
    let moved = false;
    if (columnId !== undefined && String(columnId) !== String(task.columnId)) {
      const wasDone = await isDoneColumn(task.columnId);
      const isDone = await isDoneColumn(columnId);
      if (isDone && !wasDone) {
        updates.completedAt = new Date();
      } else if (!isDone && wasDone) {
        updates.completedAt = null;
      }
      updates.columnId = columnId;
      moved = true;
      activity.push({ userId: req.user._id, action: `moved task to another column` });
    }
    if (position !== undefined && position !== task.position) {
      updates.position = position;
      moved = true;
    }

    if (activity.length > 0) {
      task.activityLog.push(...activity);
    }

    const affectedUserIds = new Set();
    if (oldAssigneeId) {
      affectedUserIds.add(oldAssigneeId.toString());
    }
    if (assigneeId !== undefined) {
      if (assigneeId) {
        affectedUserIds.add(assigneeId.toString());
      }
    } else if (task.assigneeId) {
      affectedUserIds.add(task.assigneeId.toString());
    }

    Object.assign(task, updates);
    await task.save();

    if (assigneeId !== undefined && assigneeId && String(assigneeId) !== String(oldAssigneeId) && String(assigneeId) !== String(req.user._id)) {
      const boardObj = await Board.findById(task.boardId);
      const boardTitle = boardObj ? boardObj.title : 'your board';
      await createAndSendNotification({
        userId: assigneeId,
        message: `You were assigned '${task.title}' on '${boardTitle}'`,
        taskId: task._id,
        boardId: task.boardId,
        type: 'reassignment'
      });
    }

    // Trigger stats recalculation for affected users
    for (const uid of affectedUserIds) {
      await updateUserStats(uid);
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

    if (moved) {
      io.to(task.boardId.toString()).emit('task:moved', populated);
    } else {
      io.to(task.boardId.toString()).emit('task:updated', populated);
    }

    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const board = await Board.findOne({
      _id: task.boardId,
      'members.userId': req.user._id,
    });
    if (!board) return res.status(403).json({ error: 'Access denied' });

    const boardId = task.boardId.toString();
    const assigneeId = task.assigneeId;

    await task.deleteOne();

    if (assigneeId) {
      await updateUserStats(assigneeId);
    }

    io.to(boardId).emit('task:deleted', { taskId: req.params.id });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id/assignee — Reassign task assignee
router.patch('/:id/assignee', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Verify board access and roles (owners/admins only)
    const board = await Board.findOne({
      _id: task.boardId,
      'members.userId': req.user._id,
    });
    if (!board) return res.status(403).json({ error: 'Access denied' });

    const member = board.members.find(
      (m) => m.userId.toString() === req.user._id.toString()
    );
    const isAllowed = member && (member.role === 'owner' || member.role === 'admin');
    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied: Board owners and admins only' });
    }

    const { assigneeId, source } = req.body;

    const oldAssigneeId = task.assigneeId;

    // Update task
    task.assigneeId = assigneeId || null;
    task.activityLog.push({
      userId: req.user._id,
      action: assigneeId
        ? `reassigned task (AI recommendation)`
        : `unassigned task`,
      timestamp: new Date(),
    });

    await task.save();

    if (assigneeId && String(assigneeId) !== String(oldAssigneeId) && String(assigneeId) !== String(req.user._id)) {
      const boardTitle = board ? board.title : 'your board';
      await createAndSendNotification({
        userId: assigneeId,
        message: `You were assigned '${task.title}' on '${boardTitle}'`,
        taskId: task._id,
        boardId: task.boardId,
        type: 'reassignment'
      });
    }

    // Audit log insertion
    if (source === 'ai_recommendation') {
      await WorkloadAction.create({
        taskId: task._id,
        fromUserId: oldAssigneeId || null,
        toUserId: assigneeId,
        performedBy: req.user._id,
        source: 'ai_recommendation',
      });
    }

    // Trigger stats updates
    const affectedUsers = new Set();
    if (oldAssigneeId) affectedUsers.add(oldAssigneeId.toString());
    if (assigneeId) affectedUsers.add(assigneeId.toString());
    for (const uid of affectedUsers) {
      await updateUserStats(uid);
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

    // Broadcast update via Socket.io
    io.to(task.boardId.toString()).emit('task:updated', populated);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
