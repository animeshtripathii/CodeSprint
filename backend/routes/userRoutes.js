const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllUsers, getUserById, updateUserRole, toggleBlockUser, deleteUser,
} = require('../controllers/userController');

router.use(protect, authorize('admin')); // All user-management routes are admin-only

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/block', toggleBlockUser);
router.delete('/:id', deleteUser);

module.exports = router;
