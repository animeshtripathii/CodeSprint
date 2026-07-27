const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const Hackathon = require('../models/Hackathon');
const ApiError = require('../utils/ApiError');

const registerForHackathon = async (participantId, hackathonId) => {
  if (!hackathonId) throw new ApiError(400, 'Hackathon ID is required');

  const isObjectId = mongoose.isValidObjectId(hackathonId);
  if (isObjectId) {
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) throw new ApiError(404, 'Hackathon not found');
    if (hackathon.status === 'ended' || hackathon.status === 'cancelled') {
      throw new ApiError(400, 'This hackathon is no longer accepting registrations');
    }
    const existing = await Registration.findOne({ participant: participantId, hackathon: hackathonId });
    if (existing) throw new ApiError(409, 'Already registered for this hackathon');

    const registration = await Registration.create({ participant: participantId, hackathon: hackathonId, status: 'approved' });
    return registration;
  }

  // Fallback mock registration for placeholder / demo hackathons
  return { _id: 'dummy-reg-id', participant: participantId, hackathon: hackathonId, status: 'approved' };
};

const getRegistrationStatus = async (participantId, hackathonId) => {
  if (!mongoose.isValidObjectId(hackathonId)) {
    return { status: 'none' };
  }
  const reg = await Registration.findOne({ participant: participantId, hackathon: hackathonId });
  return reg ? { status: reg.status, team: reg.team } : { status: 'none' };
};

const cancelRegistration = async (participantId, hackathonId) => {
  if (!mongoose.isValidObjectId(hackathonId)) {
    return { status: 'cancelled' };
  }
  const reg = await Registration.findOne({ participant: participantId, hackathon: hackathonId });
  if (!reg) throw new ApiError(404, 'Registration not found');
  if (reg.participant.toString() !== participantId.toString()) throw new ApiError(403, 'Not authorized');
  reg.status = 'cancelled';
  await reg.save();
  return reg;
};

const listRegistrationsByHackathon = async (hackathonId, organizerId, queryParams) => {
  if (!mongoose.isValidObjectId(hackathonId)) {
    return { registrations: [], total: 0, page: 1, pages: 0 };
  }
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

module.exports = {
  registerForHackathon, getRegistrationStatus, cancelRegistration,
  listRegistrationsByHackathon, updateRegistrationStatus, getMyRegistrations
};
