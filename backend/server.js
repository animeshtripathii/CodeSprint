require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Creates the HTTP server and attaches Socket.io real-time server
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
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  },
});

// Attaches Socket.io instance to Express app for global access
app.set('io', io);

// Handles real-time socket connections and room subscriptions
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Adds socket client to team room
  socket.on('joinTeam', (teamId) => {
    socket.join(teamId);
    console.log(`Socket ${socket.id} joined team room: ${teamId}`);
  });

  // Removes socket client from team room
  socket.on('leaveTeam', (teamId) => {
    socket.leave(teamId);
    console.log(`Socket ${socket.id} left team room: ${teamId}`);
  });

  // Adds socket client to hackathon community room
  socket.on('joinHackathon', (hackathonId) => {
    const room = `hackathon_${hackathonId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined community room: ${room}`);
  });

  // Removes socket client from hackathon community room
  socket.on('leaveHackathon', (hackathonId) => {
    const room = `hackathon_${hackathonId}`;
    socket.leave(room);
    console.log(`Socket ${socket.id} left community room: ${room}`);
  });

  // Adds socket client to judge lounge room
  socket.on('joinJudgeRoom', (hackathonId) => {
    const room = `judge_${hackathonId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined judge room: ${room}`);
  });

  // Removes socket client from judge lounge room
  socket.on('leaveJudgeRoom', (hackathonId) => {
    const room = `judge_${hackathonId}`;
    socket.leave(room);
    console.log(`Socket ${socket.id} left judge room: ${room}`);
  });

  // Handles socket client disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Connects to MongoDB database and starts listening on designated port
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
