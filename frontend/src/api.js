import axios from 'axios';

/**
 * In Docker/production: all requests go through Traefik on port 80 (same origin).
 * In local dev: use localhost with direct service ports.
 *
 * VITE_API_BASE_URL is empty string in Docker (same-origin via Traefik),
 * or set to '' in .env for local dev with Traefik running on port 80.
 * For purely local dev without Docker, override in frontend/.env.local:
 *   VITE_AUTH_URL=http://localhost:8000
 *   VITE_GALLERY_URL=http://localhost:8001
 */
const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

// When using Traefik, all services are reachable via the same origin
const AUTH_URL   = import.meta.env.VITE_AUTH_URL   ?? BASE;
const GALLERY_URL = import.meta.env.VITE_GALLERY_URL ?? BASE;

export const authApi   = axios.create({ baseURL: AUTH_URL });
export const galleryApi = axios.create({ baseURL: GALLERY_URL });

// Attach JWT token to every Gallery API request
galleryApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear token and redirect to login
galleryApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────
export const login    = (username, password) =>
  authApi.post('/api/auth/login/',    { username, password });

export const register = (data) =>
  authApi.post('/api/auth/register/', data);

export const getMe = () =>
  authApi.get('/api/auth/me/', {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

// Admin
export const listUsers  = () =>
  authApi.get('/api/auth/users/', {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

export const updateUserRole = (userId, role) =>
  authApi.patch(`/api/auth/users/${userId}/role/`, { role }, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

// ── Gallery API ───────────────────────────────────────────────────────
export const getImages = (status) => {
  const params = status ? { status } : {};
  return galleryApi.get('/gallery/api/images/', { params });
};

export const getImageDetail = (id) =>
  galleryApi.get(`/gallery/api/images/${id}/`);

export const uploadImage = (formData) =>
  galleryApi.post('/gallery/api/images/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const verifyImage = (id) =>
  galleryApi.post(`/gallery/api/images/${id}/verify/`);

export const deleteImage = (id) =>
  galleryApi.delete(`/gallery/api/images/${id}/`);

export const getStats = () =>
  galleryApi.get('/gallery/api/stats/');

export const getHealth = () =>
  galleryApi.get('/gallery/api/health/');

// ── Albums ────────────────────────────────────────────────────────────
export const getAlbums      = ()         => galleryApi.get('/gallery/api/albums/');
export const createAlbum    = (data)     => galleryApi.post('/gallery/api/albums/', data);
export const getAlbum       = (id)       => galleryApi.get(`/gallery/api/albums/${id}/`);
export const deleteAlbum    = (id)       => galleryApi.delete(`/gallery/api/albums/${id}/`);

// ── Tags ──────────────────────────────────────────────────────────────
export const getTags     = ()     => galleryApi.get('/gallery/api/tags/');
export const createTag   = (data) => galleryApi.post('/gallery/api/tags/', data);
export const deleteTag   = (id)   => galleryApi.delete(`/gallery/api/tags/${id}/`);

// ── Favorites ─────────────────────────────────────────────────────────
export const getFavorites  = ()   => galleryApi.get('/gallery/api/favorites/');
export const toggleFavorite = (id) => galleryApi.post(`/gallery/api/images/${id}/favorite/`);
