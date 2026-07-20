const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const hackathonRoutes = require('./routes/hackathonRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const teamRoutes = require('./routes/teamRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const taskRoutes = require('./routes/taskRoutes');
const messageRoutes = require('./routes/messageRoutes');
const aiRoutes = require('./routes/aiRoutes');
const githubRoutes = require('./routes/githubRoutes');

const app = express();

// ─── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body parsers & utilities ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── HTTP logger (dev only) ────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Health check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: '🚀 HackForge API is running!' });
});

// ─── API Routes ───────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hackathons', hackathonRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/teams', githubRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

module.exports = app;
