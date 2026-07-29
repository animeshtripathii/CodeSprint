// ----------------------------------------------------------------------------
// API layer 
// ----------------------------------------------------------------------------
import axios from "axios";

const TOKEN_KEY = "kanban_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api",
});

// Utility to recursively map object keys
export function mapKeys(obj, formatKey) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((i) => mapKeys(i, formatKey));

  const newObj = {};
  for (const [key, value] of Object.entries(obj)) {
    // Treat _id as a special case before formatting
    let newKey = key;
    if (key === "_id") newKey = "id";
    else newKey = formatKey(key);

    newObj[newKey] = mapKeys(value, formatKey);
  }
  return newObj;
}

export const toCamelCase = (str) =>
  str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

export const toSnakeCase = (str) =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Map snake_case from boilerplate to camelCase for Mongoose backend
  if (config.data) {
    config.data = mapKeys(config.data, toCamelCase);
  }
  return config;
});

// Normalize errors to a readable message; bounce to login on 401.
api.interceptors.response.use(
  (res) => {
    // Map camelCase (and _id) from Mongoose back to snake_case for boilerplate
    res.data = mapKeys(res.data, toSnakeCase);
    return res;
  },
  (error) => {
    const message =
      error.response?.data?.error || error.message || "Something went wrong";
    if (error.response?.status === 401 && getToken()) {
      clearToken();
      if (!location.pathname.startsWith("/login")) location.assign("/login");
    }
    return Promise.reject(new Error(message));
  }
);

export default api;

export const authApi = {
  register: (data) => api.post("/auth/signup", data).then((r) => r.data),
  login: (data) => api.post("/auth/login", data).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const userApi = {
  search: (q) => api.get("/users/search", { params: { q } }).then((r) => r.data),
  stats: (id) => api.get(`/users/${id}/stats`).then((r) => r.data),
};

export const boardApi = {
  list: () => api.get("/boards").then((r) => r.data),
  create: (data) => api.post("/boards", data).then((r) => r.data),
  get: (id) => api.get(`/boards/${id}`).then((r) => r.data),
  update: (id, data) => api.patch(`/boards/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/boards/${id}`).then((r) => r.data),
  activity: (id, limit = 30) =>
    api.get(`/boards/${id}/activity`, { params: { limit } }).then((r) => r.data),
  addMember: (id, data) => api.post(`/boards/${id}/invite`, data).then((r) => r.data),
  removeMember: (id, userId) => api.delete(`/boards/${id}/members/${userId}`).then((r) => r.data),
  analyzeWorkload: (id) => api.post(`/boards/${id}/analyze-workload`).then((r) => r.data),
  getChat: (id) => api.get(`/boards/${id}/chat`).then((r) => r.data),
  sendChat: (id, text) => api.post(`/boards/${id}/chat`, { text }).then((r) => r.data),
};

export const columnApi = {
  create: (boardId, data) =>
    api.post(`/boards/${boardId}/columns`, data).then((r) => r.data),
  update: (boardId, columnId, data) =>
    api.patch(`/columns/${columnId}`, data).then((r) => r.data),
  setWipLimit: (boardId, columnId, wipLimit) =>
    api.patch(`/columns/${columnId}`, { wip_limit: wipLimit }).then((r) => r.data),
  remove: (boardId, columnId) =>
    api.delete(`/columns/${columnId}`).then((r) => r.data),
};

export const taskApi = {
  list: (boardId, params) =>
    api.get(`/boards/${boardId}/tasks`, { params }).then((r) => r.data),
  create: (boardId, data) =>
    api.post(`/columns/${data.column_id || data.columnId}/tasks`, data).then((r) => r.data),
  update: (boardId, taskId, data) =>
    api.patch(`/tasks/${taskId}`, data).then((r) => r.data),
  move: (boardId, taskId, data) =>
    api.patch(`/tasks/${taskId}`, data).then((r) => r.data),
  remove: (boardId, taskId) =>
    api.delete(`/tasks/${taskId}`).then((r) => r.data),
  reassign: (boardId, taskId, data) =>
    api.patch(`/tasks/${taskId}/assignee`, data).then((r) => r.data),
};

export const aiApi = {
  // Generate AI tasks from a goal string and optionally save them to a column.
  // When columnId is included, tasks are saved and returned as full task objects.
  // When columnId is omitted, returns preview task objects (not saved).
  generateTasks: (boardId, data) =>
    api.post(`/ai/generate-tasks`, { boardId, ...data }).then((r) => r.data),

  // AI Task Breakdown: splits a task into checklist subtasks.
  // Returns { subtasks: [{title, completed}] }
  breakdown: (boardId, data) =>
    api.post(`/ai/breakdown`, data).then((r) => r.data),

  // AI Sprint Summary: analyzes the full board and returns structured insights.
  // Returns { headline, completed[], inProgress[], risks[], recommendations[] }
  summary: (boardId) =>
    api.post(`/ai/summary`, { boardId }).then((r) => r.data.summary),
};

export const commentApi = {
  list: (taskId) => api.get(`/comments/${taskId}`).then((r) => r.data),
  create: (taskId, body) => api.post(`/comments/${taskId}`, { body }).then((r) => r.data),
  remove: (commentId) => api.delete(`/comments/${commentId}`).then((r) => r.data),
};

export const labelApi = {
  list: (boardId) => api.get(`/boards/${boardId}/labels`).then((r) => r.data),
  create: (boardId, data) => api.post(`/boards/${boardId}/labels`, data).then((r) => r.data),
  update: (boardId, labelId, data) => api.patch(`/boards/${boardId}/labels/${labelId}`, data).then((r) => r.data),
  remove: (boardId, labelId) => api.delete(`/boards/${boardId}/labels/${labelId}`).then((r) => r.data),
};

export const notificationApi = {
  list: () => api.get("/notifications").then((r) => r.data),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
};

