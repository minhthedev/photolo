import axios from 'axios';

const TOKEN_KEY = 'photo_admin_token';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (username, password) => api.post('/auth/login', { username, password });
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');
export const getPhotographers = () => api.get('/auth/photographers');
export const createPhotographer = (data) => api.post('/auth/photographers', data);
export const getAlbums = () => api.get('/albums');
export const getAlbum = (id) => api.get(`/albums/${id}`);
export const createAlbum = (data) => api.post('/albums', data);
export const updateAlbum = (id, data) => api.patch(`/albums/${id}`, data);
export const deleteAlbum = (id) => api.delete(`/albums/${id}`);
export const syncDriveImages = (albumId) => api.post(`/albums/${albumId}/sync-drive`);
export const getImages = (albumId, page = 1, limit = 24) =>
  api.get(`/images/${albumId}`, { params: { page, limit } });
export const getSelectedImages = (albumId) => api.get(`/images/${albumId}/selected`);
export const addImage = (albumId, url) =>
  api.post('/images', { album_id: albumId, url });
export const toggleImageSelection = (id) => api.patch(`/images/${id}`);
export const updateImageNote = (id, note) => api.patch(`/images/${id}/note`, { note });

export default api;
