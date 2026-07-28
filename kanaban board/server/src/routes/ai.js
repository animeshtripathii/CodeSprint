import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Task from '../models/Task.js';
import Board from '../models/Board.js';
import Column from '../models/Column.js';
import { io } from '../index.js';
import {
  generateBoardFromPrompt,
  generateTasksForGoal,
  suggestSubtasks,
  suggestPriorityAndLabels,
  generateSprintSummary,
} from '../services/ai.js';

const router = Router();
router.use(requireAuth);

// Helper to catch and format 429 / standard errors
function runWithErrorHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      if (error.status === 429) {
        return res.status(429).json({ error: 'AI is busy, try again in a moment' });
      }
      res.status(500).json({ error: error.message || 'AI request failed' });
    }
  };
}

// ── POST /api/ai/generate-board ──────────────────────────────────────────────
// Returns draft columns + tasks for bulk-importing an entire board
router.post(
  '/generate-board',
  runWithErrorHandler(async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    const result = await generateBoardFromPrompt(prompt);
    res.json(result);
  })
);

// ── POST /api/ai/generate-tasks ──────────────────────────────────────────────
// Generates a flat list of tasks from a goal string and saves them to a column.
// Body: { boardId, goal, count, columnId }
// Returns: { tasks: [...created task objects] }
router.post(
  '/generate-tasks',
  runWithErrorHandler(async (req, res) => {
    const { boardId, goal, count = 6, columnId } = req.body;
    if (!boardId) return res.status(400).json({ error: 'boardId is required' });
    if (!goal) return res.status(400).json({ error: 'goal is required' });

    // Verify board membership
    const board = await Board.findOne({ _id: boardId, 'members.userId': req.user._id });
    if (!board) return res.status(404).json({ error: 'Board not found' });

    // Generate tasks from AI
    const aiResult = await generateTasksForGoal(goal, Number(count));
    const generatedTasks = aiResult.tasks;

    // If a columnId was provided, save the tasks to that column
    if (columnId) {
      const column = await Column.findOne({ _id: columnId, boardId });
      if (!column) return res.status(404).json({ error: 'Column not found' });

      const lastTask = await Task.findOne({ columnId: column._id }).sort({ position: -1 });
      let nextPosition = lastTask ? lastTask.position + 1000 : 0;

      const isDone = /^(done|completed)$/i.test(column.title);

      const createdTasks = [];
      for (const t of generatedTasks) {
        const task = await Task.create({
          boardId: board._id,
          columnId: column._id,
          title: t.title,
          description: t.description || '',
          priority: t.priority || 'medium',
          position: nextPosition,
          completedAt: isDone ? new Date() : null,
          activityLog: [{
            userId: req.user._id,
            action: 'created via AI Task Generator',
            timestamp: new Date(),
          }],
        });

        // Populate for socket emission and response
        const populated = await Task.findById(task._id).lean();
        populated.id = populated._id;
        createdTasks.push(populated);

        // Broadcast to board room
        io.to(boardId).emit('task:created', populated);
        nextPosition += 1000;
      }

      return res.json({ tasks: createdTasks });
    }

    // No columnId — just return the preview without saving
    res.json({ tasks: generatedTasks });
  })
);

// ── POST /api/ai/breakdown ───────────────────────────────────────────────────
// Suggests checklist subtasks for a task.
// Body: { taskId }
// Returns: { subtasks: [{title, completed}] }
router.post(
  '/breakdown',
  runWithErrorHandler(async (req, res) => {
    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ error: 'taskId is required' });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Verify board membership
    const board = await Board.findOne({ _id: task.boardId, 'members.userId': req.user._id });
    if (!board) return res.status(403).json({ error: 'Access denied' });

    const result = await suggestSubtasks(task.title, task.description);
    res.json(result);
  })
);

// ── POST /api/ai/summary ─────────────────────────────────────────────────────
// Generates a sprint summary for a board.
// Body: { boardId }
// Returns: { headline, completed[], inProgress[], risks[], recommendations[] }
router.post(
  '/summary',
  runWithErrorHandler(async (req, res) => {
    const { boardId } = req.body;
    if (!boardId) return res.status(400).json({ error: 'boardId is required' });

    // Verify board membership
    const board = await Board.findOne({ _id: boardId, 'members.userId': req.user._id });
    if (!board) return res.status(404).json({ error: 'Board not found' });

    // Load full board state
    const columns = await Column.find({ boardId: board._id }).sort({ position: 1 }).lean();
    const tasks = await Task.find({ boardId: board._id }).lean();

    const summary = await generateSprintSummary(board.title, columns, tasks);
    res.json({ summary });
  })
);

// ── POST /api/ai/suggest-subtasks ────────────────────────────────────────────
// Legacy endpoint (kept for any direct callers). Body: { taskId }
router.post(
  '/suggest-subtasks',
  runWithErrorHandler(async (req, res) => {
    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ error: 'taskId is required' });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const result = await suggestSubtasks(task.title, task.description);
    res.json(result);
  })
);

// ── POST /api/ai/suggest-priority ────────────────────────────────────────────
// Body: { taskId }
router.post(
  '/suggest-priority',
  runWithErrorHandler(async (req, res) => {
    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ error: 'taskId is required' });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const board = await Board.findById(task.boardId);
    const labels = board ? board.labels : [];

    const result = await suggestPriorityAndLabels(task.title, task.description, labels);
    res.json(result);
  })
);

export default router;
