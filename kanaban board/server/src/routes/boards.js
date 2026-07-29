import { Router } from 'express';
import Board from '../models/Board.js';
import Column from '../models/Column.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { io } from '../index.js';
import { updateUserStats } from '../services/userStats.js';
import { analyzeWorkload, chatWithAI } from '../services/ai.js';
import ChatMessage from '../models/ChatMessage.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import WorkloadAction from '../models/WorkloadAction.js';

const router = Router();
router.use(requireAuth);

// GET /api/boards — boards where user is a member, enriched with counts
router.get('/', async (req, res) => {
  try {
    const boards = await Board.find({ 'members.userId': req.user._id })
      .populate('members.userId', 'name email avatarUrl')
      .sort({ updatedAt: -1 })
      .lean();

    // Aggregate task counts for all boards in a single query
    const boardIds = boards.map(b => b._id);
    const taskCounts = await Task.aggregate([
      { $match: { boardId: { $in: boardIds } } },
      { $group: { _id: '$boardId', count: { $sum: 1 } } },
    ]);
    const taskCountMap = {};
    taskCounts.forEach(t => { taskCountMap[t._id.toString()] = t.count; });

    const enriched = boards.map(b => ({
      ...b,
      taskCount: taskCountMap[b._id.toString()] || 0,
      memberCount: b.members?.length || 0,
      isOwner: b.ownerId?.toString() === req.user._id.toString(),
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/boards — create board
router.post('/', async (req, res) => {
  try {
    const { title, description, color } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const board = await Board.create({
      title,
      description,
      color,
      ownerId: req.user._id,
      members: [{ userId: req.user._id, role: 'owner' }],
      labels: [
        { name: 'Bug', color: '#ef4444' },
        { name: 'Feature', color: '#6366f1' },
        { name: 'Improvement', color: '#22c55e' },
        { name: 'Documentation', color: '#f59e0b' },
      ],
    });

    // Seed default columns
    await Column.insertMany([
      { boardId: board._id, title: 'Backlog', position: 0 },
      { boardId: board._id, title: 'In Progress', position: 1 },
      { boardId: board._id, title: 'Review', position: 2 },
      { boardId: board._id, title: 'Done', position: 3 },
    ]);

    const populated = await Board.findById(board._id)
      .populate('members.userId', 'name email avatarUrl')
      .lean();

    const enrichedBoard = {
      ...populated,
      taskCount: 0,
      memberCount: populated.members?.length || 1,
      isOwner: true,
    };
    res.status(201).json(enrichedBoard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/boards/:id — full board with columns + tasks
router.get('/:id', async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.id,
      'members.userId': req.user._id,
    })
      .populate('members.userId', 'name email avatarUrl onTimeRate activeTaskCount')
      .lean();

    if (!board) return res.status(404).json({ error: 'Board not found' });

    const columns = await Column.find({ boardId: board._id })
      .sort({ position: 1 })
      .lean();

    let tasks = await Task.find({ boardId: board._id })
      .populate('assigneeId', 'name email avatarUrl')
      .sort({ position: 1 })
      .lean();

    tasks = tasks.map(t => {
      const assignee = t.assigneeId;
      if (assignee) {
        t.assigneeId = assignee._id;
        t.assigneeName = assignee.name;
        t.assigneeEmail = assignee.email;
        t.assigneeAvatar = assignee.avatarUrl;
      }
      return t;
    });

    const members = board.members.map(m => {
      const user = m.userId || {};
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        onTimeRate: user.onTimeRate,
        activeTaskCount: user.activeTaskCount,
        role: m.role
      };
    });

    const role = board.members.find(m => m.userId?._id?.toString() === req.user._id.toString())?.role || 'member';

    res.json({ 
      board, 
      columns, 
      tasks, 
      members, 
      role 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/boards/:id — rename board
router.patch('/:id', async (req, res) => {
  try {
    const board = await Board.findOneAndUpdate(
      { _id: req.params.id, 'members.userId': req.user._id },
      { title: req.body.title, description: req.body.description, color: req.body.color },
      { new: true }
    ).lean();
    if (!board) return res.status(404).json({ error: 'Board not found' });
    io.to(req.params.id).emit('board:renamed', { boardId: req.params.id, title: req.body.title });
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/boards/:id/columns — add a column
router.post('/:id/columns', async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.id,
      'members.userId': req.user._id,
    });
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const lastCol = await Column.findOne({ boardId: board._id }).sort({ position: -1 });
    const position = lastCol ? lastCol.position + 1 : 0;

    const column = await Column.create({
      boardId: board._id,
      title: req.body.title || 'New Column',
      position,
    });

    io.to(req.params.id).emit('column:created', column);
    res.status(201).json(column);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/boards/:id/invite — add a member by email
router.post('/:id/invite', async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    const board = await Board.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!board) return res.status(404).json({ error: 'Board not found or not owner' });

    const invitee = await User.findOne({ email });
    if (!invitee) return res.status(404).json({ error: 'User with that email not found' });

    const alreadyMember = board.members.some(
      (m) => m.userId.toString() === invitee._id.toString()
    );
    if (!alreadyMember) {
      board.members.push({ userId: invitee._id, role });
      await board.save();
    }

    const newMember = {
      _id: invitee._id,
      name: invitee.name,
      email: invitee.email,
      avatarUrl: invitee.avatarUrl,
      role
    };

    res.json(newMember);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/boards/:id/bulk-import — Clear columns and tasks, and add new ones (from AI planner)
router.post('/:id/bulk-import', async (req, res) => {
  try {
    const board = await Board.findOne({ _id: req.params.id, 'members.userId': req.user._id });
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const { columns } = req.body;
    if (!columns || !Array.isArray(columns)) {
      return res.status(400).json({ error: 'Invalid columns data format' });
    }

    // 1. Delete existing columns and tasks
    await Column.deleteMany({ boardId: board._id });
    await Task.deleteMany({ boardId: board._id });

    // 2. Create columns and tasks
    for (let cIdx = 0; cIdx < columns.length; cIdx++) {
      const colData = columns[cIdx];
      const column = await Column.create({
        boardId: board._id,
        title: colData.title || colData.name,
        position: cIdx,
      });

      if (colData.tasks && Array.isArray(colData.tasks)) {
        const tasksToInsert = colData.tasks.map((task, tIdx) => {
          // Map priority labels to valid board labels if matched
          const matchedLabelIds = [];
          if (task.labels && Array.isArray(task.labels)) {
            task.labels.forEach((lName) => {
              const matchedLabel = board.labels.find(
                (bl) => bl.name.toLowerCase() === lName.toLowerCase()
              );
              if (matchedLabel) {
                matchedLabelIds.push(matchedLabel._id);
              }
            });
          }

          return {
            boardId: board._id,
            columnId: column._id,
            title: task.title,
            description: task.description,
            position: tIdx,
            priority: task.priority || 'medium',
            labelIds: matchedLabelIds,
            activityLog: [
              {
                userId: req.user._id,
                action: 'created via AI Assistant plan',
                timestamp: new Date(),
              },
            ],
          };
        });
        await Task.insertMany(tasksToInsert);
      }
    }

    // Emit updates to the socket room
    io.to(req.params.id).emit('board:reloaded', { boardId: req.params.id });

    res.json({ message: 'Board layout bulk imported successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/boards/:id — Delete board and all its associated data
router.delete('/:id', async (req, res) => {
  try {
    const board = await Board.findOneAndDelete({ _id: req.params.id, ownerId: req.user._id });
    if (!board) return res.status(404).json({ error: 'Board not found or not owner' });

    // Gather list of tasks to cleanup task-dependent relations (comments, workload audits)
    const tasks = await Task.find({ boardId: board._id }).lean();
    const taskIds = tasks.map(t => t._id);
    const affectedAssignees = [...new Set(tasks.map(t => t.assigneeId?.toString()).filter(Boolean))];

    // Cleanup all related documents cascadingly
    await Column.deleteMany({ boardId: board._id });
    await Task.deleteMany({ boardId: board._id });
    await Comment.deleteMany({ taskId: { $in: taskIds } });
    await ChatMessage.deleteMany({ boardId: board._id });
    await Notification.deleteMany({ boardId: board._id });
    await WorkloadAction.deleteMany({ taskId: { $in: taskIds } });

    // Recalculate stats for teammates who had tasks assigned
    for (const uid of affectedAssignees) {
      await updateUserStats(uid);
    }

    // Notify connected sockets that the board has been deleted
    io.to(req.params.id).emit('board:deleted', { boardId: req.params.id });

    res.json({ message: 'Board and all associated data deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/boards/:id/activity — Get board activity
router.get('/:id/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const board = await Board.findOne({ _id: req.params.id, 'members.userId': req.user._id });
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const tasks = await Task.find({ boardId: board._id })
      .select('title activityLog')
      .populate('activityLog.userId', 'name email avatarUrl')
      .lean();

    let activities = [];
    tasks.forEach(t => {
      if (t.activityLog) {
        t.activityLog.forEach(log => {
          activities.push({
            id: log._id || Math.random().toString(),
            taskTitle: t.title,
            taskId: t._id,
            action: log.action,
            timestamp: log.timestamp,
            user: log.userId
          });
        });
      }
    });

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(activities.slice(0, limit));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/boards/:id/members/:userId — Remove a member
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const board = await Board.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!board) return res.status(404).json({ error: 'Board not found or not owner' });

    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    board.members = board.members.filter(m => m.userId.toString() !== req.params.userId);
    await board.save();

    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/boards/:id/analyze-workload — analyze board workload using AI (owner/admin only)
router.post('/:id/analyze-workload', async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.id,
      'members.userId': req.user._id,
    });
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const member = board.members.find(
      (m) => m.userId.toString() === req.user._id.toString()
    );
    const isAllowed = member && (member.role === 'owner' || member.role === 'admin');
    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied: Board owners and admins only' });
    }

    const result = await analyzeWorkload(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Workload analysis route failed:', err);
    const status = err.status === 429 ? 429 : 500;
    res.status(status).json({ error: 'AI analysis failed, please try again' });
  }
});

// GET /api/boards/:id/chat — load recent board chat history (last 50 messages)
router.get('/:id/chat', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ boardId: req.params.id })
      .populate('senderId', 'name email avatarUrl')
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/boards/:id/chat — save and broadcast chat message
router.post('/:id/chat', async (req, res) => {
  try {
    const { text } = req.body;
    const boardId = req.params.id;

    // Verify board access
    const board = await Board.findOne({
      _id: boardId,
      'members.userId': req.user._id,
    });
    if (!board) return res.status(403).json({ error: 'Access denied' });

    // Save human message
    const humanMessage = await ChatMessage.create({
      boardId,
      senderId: req.user._id,
      text,
      isAI: false,
    });

    const populatedHuman = await ChatMessage.findById(humanMessage._id)
      .populate('senderId', 'name email avatarUrl')
      .lean();

    // Broadcast human message
    io.to(boardId).emit('chat:message', populatedHuman);

    // If starts with @AI, handle AI integration
    const trimmedText = text.trim();
    if (trimmedText.toLowerCase().startsWith('@ai')) {
      const strippedPrompt = trimmedText.substring(3).trim();

      let aiReplyText = '';
      try {
        aiReplyText = await chatWithAI(boardId, strippedPrompt);
      } catch (aiErr) {
        console.error('Gemini chat request failed:', aiErr);
        aiReplyText = "Sorry, I couldn't process that right now.";
      }

      // Save AI reply
      const aiMessage = await ChatMessage.create({
        boardId,
        senderId: null,
        text: aiReplyText,
        isAI: true,
      });

      const populatedAI = await ChatMessage.findById(aiMessage._id).lean();

      // Broadcast AI reply
      io.to(boardId).emit('chat:message', populatedAI);
    }

    res.status(201).json(populatedHuman);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/boards/:id/labels — list labels for a board
router.get('/:id/labels', async (req, res) => {
  try {
    const board = await Board.findOne({ _id: req.params.id, 'members.userId': req.user._id }).lean();
    if (!board) return res.status(404).json({ error: 'Board not found' });
    res.json(board.labels || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/boards/:id/labels — create a new label
router.post('/:id/labels', async (req, res) => {
  try {
    const board = await Board.findOne({ _id: req.params.id, 'members.userId': req.user._id });
    if (!board) return res.status(404).json({ error: 'Board not found' });
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Label name is required' });
    board.labels.push({ name: name.trim(), color: color || '#6366f1' });
    await board.save();
    const newLabel = board.labels[board.labels.length - 1];
    io.to(req.params.id).emit('board:labels_updated', board.labels);
    res.status(201).json(newLabel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/boards/:id/labels/:labelId — update a label
router.patch('/:id/labels/:labelId', async (req, res) => {
  try {
    const board = await Board.findOne({ _id: req.params.id, 'members.userId': req.user._id });
    if (!board) return res.status(404).json({ error: 'Board not found' });
    const label = board.labels.id(req.params.labelId);
    if (!label) return res.status(404).json({ error: 'Label not found' });
    if (req.body.name !== undefined) label.name = req.body.name.trim();
    if (req.body.color !== undefined) label.color = req.body.color;
    await board.save();
    io.to(req.params.id).emit('board:labels_updated', board.labels);
    res.json(label);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/boards/:id/labels/:labelId — delete a label
router.delete('/:id/labels/:labelId', async (req, res) => {
  try {
    const board = await Board.findOne({ _id: req.params.id, 'members.userId': req.user._id });
    if (!board) return res.status(404).json({ error: 'Board not found' });
    board.labels = board.labels.filter(l => l._id.toString() !== req.params.labelId);
    await board.save();
    io.to(req.params.id).emit('board:labels_updated', board.labels);
    res.json({ message: 'Label deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
