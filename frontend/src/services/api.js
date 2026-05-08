// services/api.js - Centralized Axios instance
// Never hardcode URLs - always use environment variables for deployment portability
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor - normalize error messages for the UI
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred. Please try again.';
    return Promise.reject(new Error(message));
  }
);

// ─── Expert APIs ────────────────────────────────────────────────────────────
export const fetchExperts = (params) =>
  api.get('/experts', { params }).then((r) => r.data);

export const fetchExpertById = (id) =>
  api.get(`/experts/${id}`).then((r) => r.data);

export const fetchCategories = () =>
  api.get('/experts/categories').then((r) => r.data);

// ─── Booking APIs ────────────────────────────────────────────────────────────
export const createBooking = (data) =>
  api.post('/bookings', data).then((r) => r.data);

export const fetchBookingsByEmail = (email, status) =>
  api.get('/bookings', { params: { email, status } }).then((r) => r.data);

export const updateBookingStatus = (id, status) =>
  api.patch(`/bookings/${id}/status`, { status }).then((r) => r.data);

export default api;
