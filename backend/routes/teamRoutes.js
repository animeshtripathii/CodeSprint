const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createTeam, getTeam, listTeams, addMember, removeMember, transferLeadership, getWorkspace } = require('../controllers/teamController');

router.post('/', protect, createTeam);
router.get('/hackathon/:hackathonId', listTeams);
router.get('/:id', protect, getTeam);
router.get('/:id/workspace', protect, getWorkspace);
router.post('/:id/members', protect, addMember);
router.delete('/:id/members/:memberId', protect, removeMember);
router.patch('/:id/leader', protect, transferLeadership);

module.exports = router;
