import axios from 'axios';
import { auth } from './firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ==================== AUTH ====================
export const registerUser = (displayName) =>
  api.post('/auth/register', { displayName });

export const getCurrentUser = () =>
  api.get('/auth/me');

// ==================== LOST ITEMS ====================
export const createLostItem = (formData) =>
  api.post('/lost-items', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

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

export default api;
