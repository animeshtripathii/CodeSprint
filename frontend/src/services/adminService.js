import api from './api';

// Fetch platform-wide admin stats
export const fetchAdminStats = () => api.get('/dashboard/admin');

// Fetch all registered users (optional filter params)
export const fetchAllUsers = (params = {}) => api.get('/admin/users', { params });

// Change a user's role
export const updateUserRole = (userId, role) =>
  api.patch(`/admin/users/${userId}/role`, { role });

// Block or unblock a user account
export const toggleUserBlock = (userId, blocked) =>
  api.patch(`/admin/users/${userId}/block`, { blocked });

// Permanently delete a user
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`);

// Fetch all hackathons across all organizers
export const fetchAllHackathons = () => api.get('/hackathons');

// Override a hackathon's lifecycle status
export const updateHackathonStatus = (hackathonId, status) =>
  api.patch(`/hackathons/${hackathonId}`, { status });

// Permanently delete a hackathon and its data
export const deleteHackathon = (hackathonId) =>
  api.delete(`/hackathons/${hackathonId}`);

// Fetch recent audit log events
export const fetchAuditLog = (limit = 50) =>
  api.get('/admin/audit-log', { params: { limit } });
