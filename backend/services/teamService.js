const Team = require('../models/Team');
const Hackathon = require('../models/Hackathon');
const Registration = require('../models/Registration');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const createTeam = async (leaderId, { hackathonId, name }) => {
  // Must be approved participant
  const reg = await Registration.findOne({ participant: leaderId, hackathon: hackathonId, status: 'approved' });
  if (!reg) throw new ApiError(403, 'You must be an approved participant to create a team');

  const existing = await Team.findOne({ hackathon: hackathonId, members: leaderId });
  if (existing) throw new ApiError(409, 'You are already in a team for this hackathon');

  const team = await Team.create({ name, hackathon: hackathonId, leader: leaderId, members: [leaderId] });
  return team.populate('leader members', 'name email avatar');
};

const getTeamById = async (teamId) => {
  const team = await Team.findById(teamId)
    .populate('leader', 'name email avatar')
    .populate('members', 'name email avatar skills')
    .populate('hackathon', 'title maxTeamSize status');
  if (!team) throw new ApiError(404, 'Team not found');
  return team;
};

const listTeamsByHackathon = async (hackathonId, queryParams = {}) => {
  const { search, page = 1, limit = 20 } = queryParams;
  const query = { hackathon: hackathonId };
  if (search) query.name = { $regex: search, $options: 'i' };
  const skip = (page - 1) * limit;
  const [teams, total] = await Promise.all([
    Team.find(query).populate('leader members', 'name email avatar').skip(skip).limit(Number(limit)),
    Team.countDocuments(query),
  ]);
  return { teams, total, page: Number(page), pages: Math.ceil(total / limit) };
};

const addMember = async (teamId, leaderId, memberEmail) => {
  const team = await Team.findById(teamId).populate('hackathon');
  if (!team) throw new ApiError(404, 'Team not found');
  if (team.leader.toString() !== leaderId.toString()) throw new ApiError(403, 'Only team leader can add members');

  const maxMembers = team.hackathon?.maxTeamSize || 4;
  if (team.members.length >= maxMembers) {
    throw new ApiError(400, `Team is full according to hackathon guidelines (max ${maxMembers} members)`);
  }

  const user = await User.findOne({ email: memberEmail });
  if (!user) {
    // Save as pending email invite
    const existsInPending = (team.pendingInvites || []).some(inv => inv.email.toLowerCase() === memberEmail.toLowerCase());
    if (!existsInPending) {
      team.pendingInvites.push({ email: memberEmail, invitedAt: new Date() });
      await team.save();
    }
    return team.populate('leader members', 'name email avatar');
  }

  const reg = await Registration.findOne({ participant: user._id, hackathon: team.hackathon._id, status: 'approved' });
  if (!reg) throw new ApiError(400, 'User must be registered as an approved participant in this hackathon');

  if (team.members.map((m) => m.toString()).includes(user._id.toString())) {
    throw new ApiError(409, 'User is already in this team');
  }

  team.members.push(user._id);
  // Remove from pending if present
  team.pendingInvites = (team.pendingInvites || []).filter(inv => inv.email.toLowerCase() !== memberEmail.toLowerCase());
  await team.save();
  return team.populate('leader members', 'name email avatar');
};

const removeMember = async (teamId, leaderId, memberId) => {
  const team = await Team.findById(teamId);
  if (!team) throw new ApiError(404, 'Team not found');
  if (team.leader.toString() !== leaderId.toString()) throw new ApiError(403, 'Only team leader can remove members');
  if (memberId === leaderId.toString()) throw new ApiError(400, 'Leader cannot remove themselves — transfer leadership first');
  team.members = team.members.filter((m) => m.toString() !== memberId);
  await team.save();
  return team;
};

const transferLeadership = async (teamId, currentLeaderId, newLeaderId) => {
  const team = await Team.findById(teamId);
  if (!team) throw new ApiError(404, 'Team not found');
  if (team.leader.toString() !== currentLeaderId.toString()) throw new ApiError(403, 'Only team leader can transfer leadership');
  if (!team.members.map((m) => m.toString()).includes(newLeaderId)) {
    throw new ApiError(400, 'New leader must be a team member');
  }
  team.leader = newLeaderId;
  await team.save();
  return team;
};

const getWorkspace = async (teamId, userId) => {
  const team = await Team.findById(teamId)
    .populate('leader members', 'name email avatar skills')
    .populate('hackathon', 'title status startDate endDate maxTeamSize');
  if (!team) throw new ApiError(404, 'Team not found');

  const isMember = team.members.some((m) => m._id.toString() === userId.toString());
  if (!isMember) throw new ApiError(403, 'Not a member of this team');

  const Task = require('../models/Task');
  const Submission = require('../models/Submission');

  const [tasks, submission] = await Promise.all([
    Task.find({ team: teamId }).populate('assignedTo', 'name avatar').sort({ createdAt: -1 }),
    Submission.findOne({ team: teamId }),
  ]);

  return { team, tasks, submission, repoTree: team.repoTree };
};

const selfJoin = async (teamId, userId) => {
  const team = await Team.findById(teamId).populate('hackathon');
  if (!team) throw new ApiError(404, 'Team not found');

  const maxMembers = team.hackathon?.maxTeamSize || 4;
  if (team.members.length >= maxMembers) {
    throw new ApiError(400, `Team is full (max ${maxMembers} members)`);
  }

  if (team.members.map((m) => m.toString()).includes(userId.toString())) {
    throw new ApiError(409, 'You are already a member of this team');
  }

  // Auto-approve registration if not already registered for the hackathon
  let reg = await Registration.findOne({ participant: userId, hackathon: team.hackathon._id });
  if (!reg) {
    reg = await Registration.create({ participant: userId, hackathon: team.hackathon._id, status: 'approved' });
  } else if (reg.status !== 'approved') {
    reg.status = 'approved';
    await reg.save();
  }

  // Check the user isn't already in another team for this hackathon
  const existingTeam = await Team.findOne({ hackathon: team.hackathon._id, members: userId, _id: { $ne: teamId } });
  if (existingTeam) throw new ApiError(409, 'You are already in a different team for this hackathon');

  team.members.push(userId);
  // Remove from pending invites if they were invited by email
  const user = await User.findById(userId);
  if (user?.email) {
    team.pendingInvites = (team.pendingInvites || []).filter(inv => inv.email.toLowerCase() !== user.email.toLowerCase());
  }
  await team.save();
  return team.populate('leader members', 'name email avatar');
};

module.exports = { createTeam, getTeamById, listTeamsByHackathon, addMember, removeMember, transferLeadership, getWorkspace, selfJoin };
