require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Hackathon = require('../models/Hackathon');
const Registration = require('../models/Registration');
const Team = require('../models/Team');
const connectDB = require('../config/db');

const createDummyHackathons = async () => {
  try {
    await connectDB();
    console.log('🚀 Seeding test dummy hackathons...');

    // Find or create test organizer
    let organizer = await User.findOne({ email: 'organizer@hackforge.dev' });
    if (!organizer) {
      organizer = await User.create({
        name: 'Alex Organizer',
        email: 'organizer@hackforge.dev',
        password: 'Password@123',
        role: 'organizer',
        authProvider: 'local'
      });
    }

    // Find or create test judge
    let judge = await User.findOne({ email: 'judge@hackforge.dev' });
    if (!judge) {
      judge = await User.create({
        name: 'Sarah Judge',
        email: 'judge@hackforge.dev',
        password: 'Password@123',
        role: 'judge',
        authProvider: 'local'
      });
    }

    // Find or create test admin
    let admin = await User.findOne({ email: 'admin@hackforge.dev' });
    if (!admin) {
      admin = await User.create({
        name: 'Admin User',
        email: 'admin@hackforge.dev',
        password: 'Password@123',
        role: 'admin',
        authProvider: 'local'
      });
    }

    // Find or create test participant
    let participant = await User.findOne({ email: 'participant@hackforge.dev' });
    if (!participant) {
      participant = await User.create({
        name: 'Jordan Participant',
        email: 'participant@hackforge.dev',
        password: 'Password@123',
        role: 'participant',
        authProvider: 'local'
      });
    }



    const now = new Date();

    const dummyHackathons = [
      {
        title: 'HackForge 2026 — AI & Multi-Agent Innovation Sprint',
        description: 'Build cutting-edge multi-agent systems, generative AI tools, and full-stack autonomous web apps. 48 hours of high-speed development with real-time judging.',
        theme: 'Artificial Intelligence & Autonomous Agents',
        mode: 'online',
        registrationDeadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
        prizePool: '$15,000',
        maxTeamSize: 4,
        organizer: organizer._id,
        judges: [judge._id],
        status: 'open',
        judgingCriteria: [
          { criterion: 'Innovation', maxScore: 10, description: 'Novelty of the AI concept.' },
          { criterion: 'Technical Execution', maxScore: 10, description: 'Code quality and stability.' },
          { criterion: 'Presentation & UI', maxScore: 10, description: 'Demo & glassmorphic design.' },
        ],
        tags: ['AI', 'React', 'Node.js', 'MongoDB', 'Agents'],
        bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Global Web3 & Decentralized Finance Challenge 2026',
        description: 'Design open-source financial tools, smart contracts, and secure access control API platforms. Test your skills against global hackathon teams.',
        theme: 'Web3 & Financial Infrastructure',
        mode: 'hybrid',
        venue: 'Innovation Hub, San Francisco / Virtual',
        registrationDeadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        startDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        prizePool: '$25,000',
        maxTeamSize: 4,
        organizer: organizer._id,
        judges: [judge._id],
        status: 'open',
        judgingCriteria: [
          { criterion: 'Security & Access Control', maxScore: 10, description: 'Data privacy and RBAC.' },
          { criterion: 'Feasibility', maxScore: 10, description: 'Real-world deployment readiness.' },
        ],
        tags: ['Web3', 'Finance', 'API', 'Security'],
        bannerUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80'
      }
    ];

    for (const hData of dummyHackathons) {
      let existing = await Hackathon.findOne({ title: hData.title });
      if (!existing) {
        existing = await Hackathon.create(hData);
        console.log(`✅ Created Hackathon: "${existing.title}" (ID: ${existing._id})`);
      } else {
        console.log(`ℹ️ Hackathon already exists: "${existing.title}" (ID: ${existing._id})`);
      }
    }

    console.log('\n🎉 Dummy hackathons created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating dummy hackathons:', err);
    process.exit(1);
  }
};

createDummyHackathons();
