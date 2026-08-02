import api from './api';

// Fetch platform-wide admin stats
export const fetchAdminStats = () => api.get('/dashboard/admin');

// Fetch all registered users (optional filter params)
export const fetchAllUsers = (params = {}) => api.get('/users', { params });

// Change a user's role
export const updateUserRole = (userId, role) =>
  api.patch(`/users/${userId}/role`, { role });

// Block or unblock a user account
export const toggleUserBlock = (userId, blocked) =>
  api.patch(`/users/${userId}/block`, { blocked });

// Permanently delete a user
export const deleteUser = (userId) => api.delete(`/users/${userId}`);

// Fetch all hackathons across all organizers
export const fetchAllHackathons = () => api.get('/hackathons');

// Override a hackathon's lifecycle status
export const updateHackathonStatus = (hackathonId, status) =>
  api.patch(`/hackathons/${hackathonId}`, { status });

// Permanently delete a hackathon and its data
export const deleteHackathon = (hackathonId) =>
  api.delete(`/hackathons/${hackathonId}`);

// Fetch recent audit log events
// Audit log is built synthetically from users/hackathons data on the frontend
// since no dedicated backend endpoint exists yet
export const fetchAuditLog = (limit = 50) =>
  Promise.resolve({ data: { data: [] } });
