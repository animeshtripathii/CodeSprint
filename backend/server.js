require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// ─── Create HTTP server & attach Socket.io ─────────────────────────────────
const httpServer = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Make io accessible to route handlers
app.set('io', io);

// ─── Socket.io events ──────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Join a team's private room
  socket.on('joinTeam', (teamId) => {
    socket.join(teamId);
    console.log(`Socket ${socket.id} joined team room: ${teamId}`);
  });

  // Leave a team's room
  socket.on('leaveTeam', (teamId) => {
    socket.leave(teamId);
    console.log(`Socket ${socket.id} left team room: ${teamId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ─── Start server ──────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`\n🚀 HackForge server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
};

startServer();

module.exports = { io };
