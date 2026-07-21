const Registration = require('../models/Registration');
const Hackathon = require('../models/Hackathon');
const ApiError = require('../utils/ApiError');

const registerForHackathon = async (participantId, hackathonId) => {
  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) throw new ApiError(404, 'Hackathon not found');
  if (hackathon.status === 'ended' || hackathon.status === 'cancelled') {
    throw new ApiError(400, 'This hackathon is no longer accepting registrations');
  }
  if (new Date() > new Date(hackathon.registrationDeadline)) {
    throw new ApiError(400, 'Registration deadline has passed');
  }
  const existing = await Registration.findOne({ participant: participantId, hackathon: hackathonId });
  if (existing) throw new ApiError(409, 'Already registered for this hackathon');

  const registration = await Registration.create({ participant: participantId, hackathon: hackathonId });
  return registration;
};

const cancelRegistration = async (participantId, hackathonId) => {
  const reg = await Registration.findOne({ participant: participantId, hackathon: hackathonId });
  if (!reg) throw new ApiError(404, 'Registration not found');
  if (reg.participant.toString() !== participantId.toString()) throw new ApiError(403, 'Not authorized');
  reg.status = 'cancelled';
  await reg.save();
  return reg;
};

const listRegistrationsByHackathon = async (hackathonId, organizerId, queryParams) => {
  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) throw new ApiError(404, 'Hackathon not found');
  if (hackathon.organizer.toString() !== organizerId.toString()) {
    throw new ApiError(403, 'Only the organizer can view registrations');
  }
  const { status, page = 1, limit = 20 } = queryParams;
  const query = { hackathon: hackathonId };
  if (status) query.status = status;
  const skip = (page - 1) * limit;
  const [registrations, total] = await Promise.all([
    Registration.find(query).populate('participant', 'name email avatar skills').skip(skip).limit(Number(limit)),
    Registration.countDocuments(query),
  ]);
  return { registrations, total, page: Number(page), pages: Math.ceil(total / limit) };
};

const updateRegistrationStatus = async (registrationId, status, organizerId) => {
  const reg = await Registration.findById(registrationId).populate({ path: 'hackathon', select: 'organizer' });
  if (!reg) throw new ApiError(404, 'Registration not found');
  if (reg.hackathon.organizer.toString() !== organizerId.toString()) {
    throw new ApiError(403, 'Only the organizer can update registration status');
  }
  reg.status = status;
  if (status === 'approved') reg.approvedAt = new Date();
  await reg.save();
  return reg;
};

const getMyRegistrations = async (participantId) => {
  return Registration.find({ participant: participantId }).populate('hackathon', 'title status startDate endDate banner');
};

module.exports = { registerForHackathon, cancelRegistration, listRegistrationsByHackathon, updateRegistrationStatus, getMyRegistrations };
