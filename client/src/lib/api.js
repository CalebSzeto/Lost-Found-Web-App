import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const AUTH_TOKEN_KEY = 'authToken';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ==================== AUTH ====================
export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }
};

export const registerUser = (email, password, displayName) =>
  api.post('/auth/register', { email, password, displayName });

export const loginUser = (email, password) =>
  api.post('/auth/login', { email, password });

export const getCurrentUser = () =>
  api.get('/auth/me');

export const resetRequiredPassword = (email, currentPassword, newPassword) =>
  api.post('/auth/reset-required', { email, currentPassword, newPassword });

// ==================== LOST ITEMS ====================
export const createLostItem = (formData) =>
  api.post('/lost-items', formData);

export const getLostItems = (params) =>
  api.get('/lost-items', { params });

export const getLostItem = (id) =>
  api.get(`/lost-items/${id}`);

export const updateLostItem = (id, data) =>
  api.put(`/lost-items/${id}`, data);

export const deleteLostItem = (id) =>
  api.delete(`/lost-items/${id}`);

// ==================== FOUND ITEMS ====================
export const createFoundItem = (data) =>
  api.post('/found-items', data);

export const getFoundItems = (params) =>
  api.get('/found-items', { params });

export const getFoundItem = (id) =>
  api.get(`/found-items/${id}`);

export const updateFoundItem = (id, data) =>
  api.put(`/found-items/${id}`, data);

export const deleteFoundItem = (id) =>
  api.delete(`/found-items/${id}`);

// ==================== MESSAGES ====================
export const sendMessage = (data) =>
  api.post('/messages', data);

export const getConversations = () =>
  api.get('/messages/conversations');

export const getMessages = (partnerId, postId) =>
  api.get(`/messages/${partnerId}`, { params: { post_id: postId } });

export const blockUser = (userId) =>
  api.post(`/messages/block/${userId}`);

export const unblockUser = (userId) =>
  api.delete(`/messages/block/${userId}`);

export const getBlockedUsers = () =>
  api.get('/messages/blocked');

export const endConversation = (partnerId, postId) =>
  api.delete(`/messages/conversation/${partnerId}`, { params: { post_id: postId } });

// ==================== ADMIN ====================
export const adminListUsers = () =>
  api.get('/admin/users');

export const adminSetUserStatus = (userId, data) =>
  api.patch(`/admin/users/${userId}/status`, data);

export const adminForceLogout = (userId, reason) =>
  api.post(`/admin/users/${userId}/force-logout`, { reason });

export const adminForcePasswordReset = (userId, reason) =>
  api.post(`/admin/users/${userId}/force-password-reset`, { reason });

export const adminDeleteUser = (userId, reason) =>
  api.delete(`/admin/users/${userId}`, { data: { reason } });

export const adminModerateLostPost = (postId, payload) =>
  api.patch(`/admin/posts/lost/${postId}`, payload);

export const adminModerateFoundPost = (postId, payload) =>
  api.patch(`/admin/posts/found/${postId}`, payload);

export const adminGetPostHistory = (type, id) =>
  api.get(`/admin/posts/${type}/${id}/history`);

export const adminListMessages = (params) =>
  api.get('/admin/messages', { params });

export const adminDeleteMessage = (messageId, reason) =>
  api.delete(`/admin/messages/${messageId}`, { data: { reason } });

export const adminListAuditLogs = (params) =>
  api.get('/admin/audit-logs', { params });

export default api;
