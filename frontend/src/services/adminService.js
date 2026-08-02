// adminService.js
// ─────────────────────────────────────────────────────────────────────────────
// Centralized API service module for all admin-scoped backend calls.
// Each function maps directly to a protected admin route on the Express server.
// All calls are authenticated via the Bearer token attached by the Axios
// interceptor defined in services/api.js.
// ─────────────────────────────────────────────────────────────────────────────

import api from './api';

// ── Dashboard Overview ───────────────────────────────────────────────────────

/**
 * Fetches platform-wide aggregate statistics for the admin overview panel.
 * Returns totals for users, hackathons, submissions, reviews, and teams.
 */
export const fetchAdminStats = () => api.get('/dashboard/admin');

// ── User Management ──────────────────────────────────────────────────────────

/**
 * Retrieves the full list of registered users from the database.
 * Supports optional server-side filtering via query params (role, search).
 * @param {Object} params - Optional query parameters for filtering
 */
export const fetchAllUsers = (params = {}) => api.get('/admin/users', { params });

/**
 * Updates the platform role assigned to a specific user account.
 * Valid roles: participant | organizer | judge | admin
 * @param {string} userId - MongoDB _id of the target user
 * @param {string} role   - New role string to assign
 */
export const updateUserRole = (userId, role) =>
  api.patch(`/admin/users/${userId}/role`, { role });

/**
 * Toggles the blocked/unblocked status of a user account.
 * Blocked users are prevented from logging in or accessing protected routes.
 * @param {string}  userId  - MongoDB _id of the target user
 * @param {boolean} blocked - True to block; false to unblock
 */
export const toggleUserBlock = (userId, blocked) =>
  api.patch(`/admin/users/${userId}/block`, { blocked });

/**
 * Permanently deletes a user record and all associated data.
 * This operation is irreversible — confirm before calling.
 * @param {string} userId - MongoDB _id of the user to delete
 */
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`);

// ── Hackathon Oversight ──────────────────────────────────────────────────────

/**
 * Retrieves all hackathons across all organizers for platform-wide oversight.
 * Returns full hackathon documents including organizer info and participant count.
 */
export const fetchAllHackathons = () => api.get('/hackathons');

/**
 * Force-updates the status of any hackathon regardless of organizer ownership.
 * Admin override — used to manually advance lifecycle states.
 * @param {string} hackathonId - MongoDB _id of the hackathon
 * @param {string} status      - New status: draft | open | ongoing | ended
 */
export const updateHackathonStatus = (hackathonId, status) =>
  api.patch(`/hackathons/${hackathonId}`, { status });

/**
 * Permanently removes a hackathon and all associated registrations/submissions.
 * @param {string} hackathonId - MongoDB _id of the hackathon to delete
 */
export const deleteHackathon = (hackathonId) =>
  api.delete(`/hackathons/${hackathonId}`);

// ── Audit & Activity Log ─────────────────────────────────────────────────────

/**
 * Fetches recent platform activity events for the admin audit log panel.
 * Returns timestamped action records sorted by most recent first.
 * @param {number} limit - Maximum number of events to return (default: 50)
 */
export const fetchAuditLog = (limit = 50) =>
  api.get('/admin/audit-log', { params: { limit } });
