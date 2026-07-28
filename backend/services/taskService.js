const Task = require('../models/Task');
const Team = require('../models/Team');
const ApiError = require('../utils/ApiError');

const isMember = (team, userId) => team.members.map((m) => m.toString()).includes(userId.toString());

const createTask = async (creatorId, data) => {
  const team = await Team.findById(data.teamId);
  if (!team) throw new ApiError(404, 'Team not found');
  if (!isMember(team, creatorId)) throw new ApiError(403, 'Not a team member');

  const assignedToVal = (data.assignedTo && typeof data.assignedTo === 'string' && data.assignedTo.trim() !== '') 
    ? data.assignedTo.trim() 
    : null;

  const task = await Task.create({
    team: data.teamId,
    hackathon: data.hackathonId || team.hackathon,
    title: data.title,
    description: data.description || '',
    assignedTo: assignedToVal,
    createdBy: creatorId,
    priority: data.priority || 'medium',
    dueDate: data.dueDate || null,
    status: data.status || 'todo',
    aiGenerated: data.aiGenerated || false,
    effortEstimate: data.effortEstimate || '',
  });

  return task.populate('assignedTo createdBy', 'name avatar email');
};

const bulkCreateTasks = async (creatorId, teamId, tasks) => {
  const team = await Team.findById(teamId);
  if (!team) throw new ApiError(404, 'Team not found');
  if (!isMember(team, creatorId)) throw new ApiError(403, 'Not a team member');

  const docs = tasks.map((t) => ({
    team: teamId,
    hackathon: team.hackathon,
    title: t.title,
    description: t.description || '',
    priority: t.suggestedPriority || 'medium',
    createdBy: creatorId,
    aiGenerated: true,
    effortEstimate: t.effortEstimate || '',
    status: 'todo',
  }));

  const created = await Task.insertMany(docs);
  return created;
};

const listByTeam = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) throw new ApiError(404, 'Team not found');
  if (!isMember(team, userId)) throw new ApiError(403, 'Not a team member');
  return Task.find({ team: teamId })
    .populate('assignedTo createdBy', 'name avatar email')
    .sort({ createdAt: -1 });
};

const updateTaskStatus = async (taskId, userId, status) => {
  const task = await Task.findById(taskId).populate('team');
  if (!task) throw new ApiError(404, 'Task not found');
  const team = task.team;
  if (!isMember(team, userId)) throw new ApiError(403, 'Not authorized — must be a team member');
  task.status = status;
  await task.save();
  return task.populate('assignedTo createdBy', 'name avatar email');
};

const assignTask = async (taskId, requesterId, assigneeId) => {
  const task = await Task.findById(taskId).populate('team');
  if (!task) throw new ApiError(404, 'Task not found');
  const team = task.team;
  if (!isMember(team, requesterId)) throw new ApiError(403, 'Not authorized — must be a team member');
  
  const assignedToVal = (assigneeId && typeof assigneeId === 'string' && assigneeId.trim() !== '') 
    ? assigneeId.trim() 
    : null;

  if (assignedToVal && !isMember(team, assignedToVal)) {
    throw new ApiError(400, 'Assignee must be a member of this team');
  }

  task.assignedTo = assignedToVal;
  await task.save();
  return task.populate('assignedTo createdBy', 'name avatar email');
};

const deleteTask = async (taskId, userId) => {
  const task = await Task.findById(taskId).populate('team');
  if (!task) throw new ApiError(404, 'Task not found');
  const team = task.team;
  if (!isMember(team, userId)) throw new ApiError(403, 'Not authorized — must be a team member');
  await task.deleteOne();
  return task;
};

const getCalendarData = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) throw new ApiError(404, 'Team not found');
  const isLeader = team.leader.toString() === userId.toString();
  const query = { team: teamId, dueDate: { $ne: null } };
  if (!isLeader) query.assignedTo = userId;

  const tasks = await Task.find(query).populate('assignedTo', 'name avatar');
  return tasks.map((t) => ({
    taskId: t._id,
    title: t.title,
    assignee: t.assignedTo,
    dueDate: t.dueDate,
    status: t.status,
    priority: t.priority,
  }));
};

module.exports = { createTask, bulkCreateTasks, listByTeam, updateTaskStatus, assignTask, deleteTask, getCalendarData };
