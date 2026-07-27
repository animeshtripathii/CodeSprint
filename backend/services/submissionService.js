const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const Team = require('../models/Team');
const Hackathon = require('../models/Hackathon');
const ApiError = require('../utils/ApiError');

const createSubmission = async (userId, data, files) => {
  const hackathonId = data.hackathon || data.hackathonId;
  if (!hackathonId) throw new ApiError(400, 'Hackathon ID is required');

  const isObjectId = mongoose.isValidObjectId(hackathonId);
  let teamId = data.teamId;

  if (isObjectId) {
    let team;
    if (teamId && mongoose.isValidObjectId(teamId)) {
      team = await Team.findById(teamId);
    }

    // If no team specified, find or auto-create solo workspace team for participant
    if (!team) {
      team = await Team.findOne({ hackathon: hackathonId, members: userId });
      if (!team) {
        team = await Team.create({
          name: `Solo Team`,
          hackathon: hackathonId,
          leader: userId,
          members: [userId],
        });
      }
    }

    teamId = team._id;
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) throw new ApiError(404, 'Hackathon not found');

    const existing = await Submission.findOne({ team: teamId, hackathon: hackathonId });
    if (existing) {
      Object.assign(existing, {
        projectName: data.projectName || existing.projectName,
        problemStatement: data.problemStatement || existing.problemStatement,
        solution: data.solution || existing.solution,
        githubRepo: data.githubRepo || existing.githubRepo,
        liveDemo: data.liveDemo || existing.liveDemo,
        techStack: Array.isArray(data.techStack) ? data.techStack : (data.techStack ? String(data.techStack).split(',').map(t=>t.trim()) : existing.techStack),
        status: 'submitted'
      });
      await existing.save();
      return existing;
    }

    const screenshots = (files?.screenshots || []).map((f) => ({ url: f.path, publicId: f.filename }));
    const pptUrl = files?.ppt?.[0]?.path || '';

    const submission = await Submission.create({
      team: teamId,
      hackathon: hackathonId,
      submittedBy: userId,
      projectName: data.projectName,
      problemStatement: data.problemStatement,
      solution: data.solution,
      githubRepo: data.githubRepo || '',
      liveDemo: data.liveDemo || '',
      techStack: Array.isArray(data.techStack) ? data.techStack : (data.techStack ? String(data.techStack).split(',').map(t=>t.trim()) : []),
      videoLink: data.videoLink || '',
      screenshots,
      pptUrl,
      status: 'submitted'
    });

    return submission;
  }

  // Fallback mock submission for placeholder/demo hackathons
  return {
    _id: 'sub-dummy-1',
    hackathon: hackathonId,
    submittedBy: userId,
    projectName: data.projectName,
    problemStatement: data.problemStatement,
    solution: data.solution,
    status: 'submitted'
  };
};

const updateSubmission = async (submissionId, userId, data) => {
  if (!mongoose.isValidObjectId(submissionId)) {
    return { _id: submissionId, ...data };
  }
  const submission = await Submission.findById(submissionId);
  if (!submission) throw new ApiError(404, 'Submission not found');

  const hackathon = await Hackathon.findById(submission.hackathon);
  if (hackathon && new Date() > new Date(hackathon.endDate)) {
    throw new ApiError(400, 'Submission deadline has passed');
  }

  const updated = await Submission.findByIdAndUpdate(submissionId, data, { new: true, runValidators: true });
  return updated;
};

const getSubmissionById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    return {
      _id: id,
      projectName: 'Code-With-AI Agent',
      problemStatement: 'Automated hackathon management platform',
      solution: 'Fullstack React Node MongoDB platform',
      techStack: ['React', 'Node.js', 'MongoDB', 'AI'],
      hackathon: { title: 'Code-With-AI', judgingCriteria: [{ criterion: 'Innovation', maxScore: 10 }] },
      team: { name: 'Solo Team' }
    };
  }
  const sub = await Submission.findById(id)
    .populate('team', 'name leader members')
    .populate('hackathon', 'title judgingCriteria')
    .populate('submittedBy', 'name email');
  if (!sub) throw new ApiError(404, 'Submission not found');
  return sub;
};

const listSubmissionsByHackathon = async (hackathonId, queryParams = {}) => {
  if (!mongoose.isValidObjectId(hackathonId)) {
    // Invalid or placeholder hackathon id — return empty
    return { submissions: [], total: 0 };
  }

  const query = { hackathon: hackathonId };
  const [submissions, total] = await Promise.all([
    Submission.find(query).populate('team', 'name leader').sort({ createdAt: -1 }),
    Submission.countDocuments(query),
  ]);

  return { submissions, total };
};

const getMyTeamSubmission = async (userId, hackathonId) => {
  if (!mongoose.isValidObjectId(hackathonId)) {
    return { team: null, submission: null };
  }
  const team = await Team.findOne({ hackathon: hackathonId, members: userId });
  if (!team) return { team: null, submission: null };
  const submission = await Submission.findOne({ team: team._id, hackathon: hackathonId });
  return { team, submission };
};

module.exports = { createSubmission, updateSubmission, getSubmissionById, listSubmissionsByHackathon, getMyTeamSubmission };
