const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createTeam, getTeam, listTeams, addMember, removeMember, transferLeadership, getWorkspace, selfJoin, getTeamByCode } = require('../controllers/teamController');

router.post('/', protect, createTeam);
router.get('/hackathon/:hackathonId', listTeams);
// Invite code lookup — must come BEFORE /:id to avoid conflict
router.get('/code/:code', protect, getTeamByCode);
router.get('/:id', protect, getTeam);
router.get('/:id/workspace', protect, getWorkspace);
router.post('/:id/members', protect, addMember);
// Self-join via invite link (any authenticated user, no leader required)
router.post('/:id/join', protect, selfJoin);
router.delete('/:id/members/:memberId', protect, removeMember);
router.patch('/:id/leader', protect, transferLeadership);

module.exports = router;
