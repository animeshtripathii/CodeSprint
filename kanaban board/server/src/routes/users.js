import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/users/search?q=
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const regex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [{ name: regex }, { email: regex }],
    })
      .select('name email avatarUrl')
      .limit(10)
      .lean();

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id/stats
router.get('/:id/stats', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      onTimeCount: user.onTimeCount || 0,
      lateCount: user.lateCount || 0,
      onTimeRate: user.onTimeRate || 0,
      activeTaskCount: user.activeTaskCount || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
