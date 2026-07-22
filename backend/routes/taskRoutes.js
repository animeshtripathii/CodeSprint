const asyncHandler = require('express-async-handler');
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const taskService = require('../services/taskService');
const ApiResponse = require('../utils/ApiResponse');

const emitTaskEvent = (req, teamId, event, data) => {
  const io = req.app.get('io');
  if (io) io.to(teamId.toString()).emit(event, data);
};

router.post('/', protect, asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user._id, req.body);
  emitTaskEvent(req, req.body.teamId, 'task:created', task);
  return res.status(201).json(new ApiResponse(201, task, 'Task created'));
}));

router.get('/team/:teamId', protect, asyncHandler(async (req, res) => {
  const tasks = await taskService.listByTeam(req.params.teamId, req.user._id);
  return res.status(200).json(new ApiResponse(200, tasks, 'Tasks fetched'));
}));

router.get('/team/:teamId/calendar', protect, asyncHandler(async (req, res) => {
  const data = await taskService.getCalendarData(req.params.teamId, req.user._id);
  return res.status(200).json(new ApiResponse(200, data, 'Calendar data fetched'));
}));

router.patch('/:id/status', protect, asyncHandler(async (req, res) => {
  const task = await taskService.updateTaskStatus(req.params.id, req.user._id, req.body.status);
  emitTaskEvent(req, task.team.toString(), 'task:updated', task);
  return res.status(200).json(new ApiResponse(200, task, 'Status updated'));
}));

router.patch('/:id/assign', protect, asyncHandler(async (req, res) => {
  const task = await taskService.assignTask(req.params.id, req.user._id, req.body.assigneeId);
  emitTaskEvent(req, task.team.toString(), 'task:updated', task);
  return res.status(200).json(new ApiResponse(200, task, 'Task assigned'));
}));

router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const task = await taskService.deleteTask(req.params.id, req.user._id);
  emitTaskEvent(req, task.team.toString(), 'task:deleted', { taskId: task._id });
  return res.status(200).json(new ApiResponse(200, {}, 'Task deleted'));
}));

module.exports = router;
