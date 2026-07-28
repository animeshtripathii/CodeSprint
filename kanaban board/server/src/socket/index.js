import jwt from 'jsonwebtoken';

// Board-level presence tracker
// Map of boardId -> Map of socketId -> UserDetails
const activePresence = new Map();

export function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Authenticate user socket connection and join a user-specific room
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = payload.userId;
        if (userId) {
          socket.userId = userId;
          socket.join(`user:${userId}`);
          console.log(`👥 Socket ${socket.id} joined room user:${userId}`);
        }
      } catch (err) {
        console.error('🔌 Socket authentication failed:', err.message);
      }
    }

    // ── board:join ───────────────────────────────────────────────────────────
    // Frontend emits this with { boardId, user } to join a board room.
    socket.on('board:join', ({ boardId, user }) => {
      if (!boardId) return;

      socket.join(boardId);
      socket.boardId = boardId;
      socket.user = user;

      if (user) {
        if (!activePresence.has(boardId)) {
          activePresence.set(boardId, new Map());
        }
        activePresence.get(boardId).set(socket.id, user);
      }

      // Emit current user list to everyone in the room (including the joiner)
      const currentUsers = activePresence.has(boardId)
        ? Array.from(activePresence.get(boardId).values())
        : [];
      io.to(boardId).emit('presence:sync', { users: currentUsers });
    });

    // ── presence:join (legacy alias — kept for backward compat) ──────────────
    socket.on('presence:join', ({ boardId, user }) => {
      if (!boardId || !user) return;
      socket.emit('board:join', { boardId, user }); // re-emit to self as board:join
      // Actually handle it directly:
      socket.join(boardId);
      socket.boardId = boardId;
      socket.user = user;
      if (!activePresence.has(boardId)) {
        activePresence.set(boardId, new Map());
      }
      activePresence.get(boardId).set(socket.id, user);
      const currentUsers = Array.from(activePresence.get(boardId).values());
      io.to(boardId).emit('presence:sync', { users: currentUsers });
    });

    // ── board:leave ──────────────────────────────────────────────────────────
    socket.on('board:leave', (boardId) => {
      handleDisconnect(socket, io, boardId);
    });

    // ── presence:leave (legacy alias) ────────────────────────────────────────
    socket.on('presence:leave', () => {
      handleDisconnect(socket, io);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      handleDisconnect(socket, io);
    });
  });
}

function handleDisconnect(socket, io, explicitBoardId) {
  const boardId = explicitBoardId || socket.boardId;
  if (boardId && activePresence.has(boardId)) {
    const boardMap = activePresence.get(boardId);
    boardMap.delete(socket.id);

    if (boardMap.size === 0) {
      activePresence.delete(boardId);
    }

    // Emit updated user list to remaining members
    const currentUsers = boardMap.size > 0
      ? Array.from(boardMap.values())
      : [];
    io.to(boardId).emit('presence:sync', { users: currentUsers });
  }
  if (boardId) {
    socket.leave(boardId);
  }
}
