require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Hackathon = require('../models/Hackathon');
const Registration = require('../models/Registration');
const Team = require('../models/Team');

const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding HackForge database...\n');

  // Wipe existing data
  await Promise.all([
    User.deleteMany({}),
    Hackathon.deleteMany({}),
    Registration.deleteMany({}),
    Team.deleteMany({}),
  ]);

  // ─── Create Users ──────────────────────────────────────────────────────────
  const [admin, organizer, judge, p1, p2, p3] = await User.create([
    { name: 'Admin User',     email: 'admin@hackforge.dev',     password: 'Admin@123',     role: 'admin',       authProvider: 'local' },
    { name: 'Eve Organizer',  email: 'organizer@hackforge.dev', password: 'Organizer@123', role: 'organizer',   authProvider: 'local' },
    { name: 'Judge Smith',    email: 'judge@hackforge.dev',     password: 'Judge@123',     role: 'judge',       authProvider: 'local' },
    { name: 'Alice Hacker',   email: 'alice@hackforge.dev',     password: 'Alice@123',     role: 'participant', authProvider: 'local', skills: ['React', 'Node.js'] },
    { name: 'Bob Builder',    email: 'bob@hackforge.dev',       password: 'Bob@123',       role: 'participant', authProvider: 'local', skills: ['Python', 'ML'] },
    { name: 'Carol Coder',    email: 'carol@hackforge.dev',     password: 'Carol@123',     role: 'participant', authProvider: 'local', skills: ['UI/UX', 'Figma'] },
  ]);

  console.log('✅ Users created');

  // ─── Create Hackathon ─────────────────────────────────────────────────────
  const now = new Date();
  const hackathon = await Hackathon.create({
    title: 'HackForge 2024 — AI Innovation Sprint',
    description: 'Build AI-powered solutions that make a real impact. 48 hours of innovation, collaboration, and code.',
    theme: 'Artificial Intelligence',
    mode: 'hybrid',
    venue: 'Tech Hub, Bangalore',
    startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    registrationDeadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    prizePool: '$10,000',
    maxTeamSize: 4,
    organizer: organizer._id,
    judges: [judge._id],
    status: 'open',
    judgingCriteria: [
      { criterion: 'Innovation', maxScore: 10, description: 'How novel and creative is the solution?' },
      { criterion: 'Feasibility', maxScore: 10, description: 'Can this realistically be built and deployed?' },
      { criterion: 'Impact', maxScore: 10, description: 'How significant is the problem being solved?' },
      { criterion: 'Technical Complexity', maxScore: 10, description: 'Quality and sophistication of the implementation.' },
      { criterion: 'Presentation', maxScore: 10, description: 'Clarity of pitch and demo quality.' },
    ],
    tags: ['AI', 'Machine Learning', 'Innovation', 'Open Source'],
  });

  console.log('✅ Hackathon created');

  // ─── Approve registrations ────────────────────────────────────────────────
  await Registration.create([
    { participant: p1._id, hackathon: hackathon._id, status: 'approved', approvedAt: new Date() },
    { participant: p2._id, hackathon: hackathon._id, status: 'approved', approvedAt: new Date() },
    { participant: p3._id, hackathon: hackathon._id, status: 'pending' },
  ]);

  console.log('✅ Registrations created');

  // ─── Create Team ──────────────────────────────────────────────────────────
  await Team.create({
    name: 'Team Epsilon',
    hackathon: hackathon._id,
    leader: p1._id,
    members: [p1._id, p2._id],
    githubRepo: 'https://github.com/animeshtripathii/hackforge',
    status: 'forming',
  });

  console.log('✅ Team created\n');
  console.log('🎉 Seed complete! Login credentials:');
  console.log('  Admin:     admin@hackforge.dev     / Admin@123');
  console.log('  Organizer: organizer@hackforge.dev / Organizer@123');
  console.log('  Judge:     judge@hackforge.dev     / Judge@123');
  console.log('  Alice:     alice@hackforge.dev     / Alice@123');
  console.log('  Bob:       bob@hackforge.dev       / Bob@123');
  console.log('  Carol:     carol@hackforge.dev     / Carol@123');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
