const Submission = require('../models/Submission');
const Team = require('../models/Team');
const Hackathon = require('../models/Hackathon');
const ApiError = require('../utils/ApiError');

const createSubmission = async (userId, data, files) => {
  const team = await Team.findById(data.teamId).populate('hackathon');
  if (!team) throw new ApiError(404, 'Team not found');
  if (team.leader.toString() !== userId.toString()) throw new ApiError(403, 'Only the team leader can submit');

  const hackathon = team.hackathon;
  if (new Date() > new Date(hackathon.endDate)) throw new ApiError(400, 'Submission deadline has passed');

  const existing = await Submission.findOne({ team: data.teamId, hackathon: hackathon._id });
  if (existing) throw new ApiError(409, 'Team has already submitted. Use update instead.');

  const screenshots = (files?.screenshots || []).map((f) => ({ url: f.path, publicId: f.filename }));
  const pptUrl = files?.ppt?.[0]?.path || '';

  const submission = await Submission.create({
    team: data.teamId,
    hackathon: hackathon._id,
    submittedBy: userId,
    projectName: data.projectName,
    problemStatement: data.problemStatement,
    solution: data.solution,
    githubRepo: data.githubRepo || '',
    liveDemo: data.liveDemo || '',
    techStack: data.techStack ? (Array.isArray(data.techStack) ? data.techStack : JSON.parse(data.techStack)) : [],
    videoLink: data.videoLink || '',
    screenshots,
    pptUrl,
  });

  return submission;
};

const updateSubmission = async (submissionId, userId, data) => {
  const submission = await Submission.findById(submissionId);
  if (!submission) throw new ApiError(404, 'Submission not found');
  if (submission.submittedBy.toString() !== userId.toString()) throw new ApiError(403, 'Not authorized');

  const hackathon = await Hackathon.findById(submission.hackathon);
  if (new Date() > new Date(hackathon.endDate)) throw new ApiError(400, 'Submission deadline has passed');

  const updated = await Submission.findByIdAndUpdate(submissionId, data, { new: true });
  return updated;
};

const getSubmissionById = async (id) => {
  const sub = await Submission.findById(id)
    .populate('team', 'name leader members')
    .populate('hackathon', 'title judgingCriteria')
    .populate('submittedBy', 'name email');
  if (!sub) throw new ApiError(404, 'Submission not found');
  return sub;
};

const listSubmissionsByHackathon = async (hackathonId, queryParams = {}) => {
  const { page = 1, limit = 20, status } = queryParams;
  const query = { hackathon: hackathonId };
  if (status) query.status = status;
  const skip = (page - 1) * limit;
  const [submissions, total] = await Promise.all([
    Submission.find(query).populate('team', 'name leader').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    Submission.countDocuments(query),
  ]);
  return { submissions, total, page: Number(page), pages: Math.ceil(total / limit) };
};

const getMyTeamSubmission = async (userId, hackathonId) => {
  const team = await Team.findOne({ hackathon: hackathonId, members: userId });
  if (!team) throw new ApiError(404, 'You are not in any team for this hackathon');
  const submission = await Submission.findOne({ team: team._id, hackathon: hackathonId });
  return { team, submission };
};

module.exports = { createSubmission, updateSubmission, getSubmissionById, listSubmissionsByHackathon, getMyTeamSubmission };
