const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const getAllUsers = async ({ page = 1, limit = 20, search, role, isBlocked }) => {
  const query = {};
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];
  if (role) query.role = role;
  if (isBlocked !== undefined) query.isBlocked = isBlocked === 'true';

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);
  return { users, total, page: Number(page), pages: Math.ceil(total / limit) };
};

const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

const updateUserRole = async (userId, role) => {
  const user = await User.findByIdAndUpdate(userId, { role }, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

const toggleBlockUser = async (userId, adminId) => {
  if (userId === adminId.toString()) throw new ApiError(400, 'Cannot block yourself');
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  user.isBlocked = !user.isBlocked;
  await user.save();
  return user;
};

const deleteUser = async (userId, adminId) => {
  if (userId === adminId.toString()) throw new ApiError(400, 'Cannot delete yourself');
  const user = await User.findByIdAndDelete(userId);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

module.exports = { getAllUsers, getUserById, updateUserRole, toggleBlockUser, deleteUser };
