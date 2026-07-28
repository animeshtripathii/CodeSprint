import Board from '../models/Board.js';

/**
 * Attach req.board and verify the requesting user is a board member.
 * Requires requireAuth to run first.
 */
export async function requireBoardAccess(req, res, next) {
  try {
    const boardId = req.params.boardId || req.params.id || req.body.boardId;
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const isMember = board.members.some(
      (m) => m.userId.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ error: 'Access denied' });

    req.board = board;
    next();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}
