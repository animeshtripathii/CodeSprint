const asyncHandler = require('express-async-handler');
const userService = require('../services/userService');
const ApiResponse = require('../utils/ApiResponse');

const getAllUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAllUsers(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Users fetched'));
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return res.status(200).json(new ApiResponse(200, user, 'User fetched'));
});

const updateUserRole = asyncHandler(async (req, res) => {
  const user = await userService.updateUserRole(req.params.id, req.body.role);
  return res.status(200).json(new ApiResponse(200, user, 'Role updated'));
});

const toggleBlockUser = asyncHandler(async (req, res) => {
  const user = await userService.toggleBlockUser(req.params.id, req.user._id);
  return res.status(200).json(new ApiResponse(200, user, `User ${user.isBlocked ? 'blocked' : 'unblocked'}`));
});

const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id, req.user._id);
  return res.status(200).json(new ApiResponse(200, {}, 'User deleted'));
});

module.exports = { getAllUsers, getUserById, updateUserRole, toggleBlockUser, deleteUser };
