const mongoose = require('mongoose');
const Hackathon = require('../models/Hackathon');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const buildQuery = (queryParams) => {
  const { search, mode, theme, status, organizer } = queryParams;
  const query = {};
  if (search) query.$or = [
    { title: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } },
    { theme: { $regex: search, $options: 'i' } },
  ];
  if (mode) query.mode = mode;
  if (theme) query.theme = { $regex: theme, $options: 'i' };
  if (status) query.status = status;
  if (organizer) query.organizer = organizer;
  return query;
};

const listHackathons = async (queryParams) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = queryParams;
  const query = buildQuery(queryParams);
  const skip = (page - 1) * limit;
  const sortOrder = order === 'asc' ? 1 : -1;

  const [hackathons, total] = await Promise.all([
    Hackathon.find(query)
      .populate('organizer', 'name email avatar')
      .populate('judges', 'name email avatar role')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit)),
    Hackathon.countDocuments(query),
  ]);

  return { hackathons, total, page: Number(page), pages: Math.ceil(total / limit) };
};

const getHackathonById = async (id) => {
  const hackathon = await Hackathon.findById(id)
    .populate('organizer', 'name email avatar')
    .populate('judges', 'name email avatar role');
  if (!hackathon) throw new ApiError(404, 'Hackathon not found');
  return hackathon;
};

const createHackathon = async (data, organizerId) => {
  const hackathon = await Hackathon.create({ ...data, organizer: organizerId });
  return hackathon;
};

const updateHackathon = async (id, data, userId, userRole) => {
  const hackathon = await Hackathon.findById(id);
  if (!hackathon) throw new ApiError(404, 'Hackathon not found');
  if (hackathon.organizer.toString() !== userId.toString() && userRole !== 'admin') {
    throw new ApiError(403, 'Not authorized to update this hackathon');
  }
  const updated = await Hackathon.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  return updated;
};

const deleteHackathon = async (id, userId, userRole) => {
  const hackathon = await Hackathon.findById(id);
  if (!hackathon) throw new ApiError(404, 'Hackathon not found');
  if (hackathon.organizer.toString() !== userId.toString() && userRole !== 'admin') {
    throw new ApiError(403, 'Not authorized to delete this hackathon');
  }
  await hackathon.deleteOne();
  return hackathon;
};

const assignJudge = async (hackathonId, judgeIdentifier, organizerId) => {
  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) throw new ApiError(404, 'Hackathon not found');
  if (hackathon.organizer.toString() !== organizerId.toString()) {
    throw new ApiError(403, 'Only the organizer can assign judges');
  }

  // Lookup user by Email OR ObjectId
  const isObjectId = mongoose.isValidObjectId(judgeIdentifier);
  const user = await User.findOne({
    $or: [
      { email: judgeIdentifier.trim().toLowerCase() },
      ...(isObjectId ? [{ _id: judgeIdentifier }] : [])
    ]
  });

  if (!user) {
    throw new ApiError(404, `No platform user found registered with email: ${judgeIdentifier}`);
  }

  // Automatically ensure user has 'judge' role permission
  if (user.role !== 'judge' && user.role !== 'admin') {
    user.role = 'judge';
    await user.save();
  }

  const judgeIdStr = user._id.toString();
  if (hackathon.judges.map((j) => j.toString()).includes(judgeIdStr)) {
    throw new ApiError(409, `User ${user.name} (${user.email}) is already assigned as a judge for this hackathon`);
  }

  hackathon.judges.push(user._id);
  await hackathon.save();

  return Hackathon.findById(hackathonId).populate('judges', 'name email avatar role');
};

const removeJudge = async (hackathonId, judgeId, organizerId) => {
  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) throw new ApiError(404, 'Hackathon not found');
  if (hackathon.organizer.toString() !== organizerId.toString()) {
    throw new ApiError(403, 'Only the organizer can remove judges');
  }
  hackathon.judges = hackathon.judges.filter((j) => j.toString() !== judgeId.toString());
  await hackathon.save();
  return Hackathon.findById(hackathonId).populate('judges', 'name email avatar role');
};

module.exports = {
  listHackathons, getHackathonById, createHackathon,
  updateHackathon, deleteHackathon, assignJudge, removeJudge,
};
