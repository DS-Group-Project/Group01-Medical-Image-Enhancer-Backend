import axios from 'axios';
import { toast } from 'react-hot-toast';

/**
 * In-memory token store.
 *
 * WHY NOT localStorage?
 * The backend issues JWT Bearer tokens (Authorization header), not HttpOnly
 * cookies. Storing in localStorage risks XSS theft. We store the token in a
 * module-level variable instead — inaccessible to other origins and cleared on
 * page reload, which is acceptable for a medical desktop-grade app used in a
 * controlled environment. A refresh-token flow or BFF pattern can be added later.
 */
let _accessToken = null;

export function setToken(token) {
  _accessToken = token;
}

export function clearToken() {
  _accessToken = null;
}

export function getToken() {
  return _accessToken;
}

/**
 * Base Axios instance for API communication.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Attach the Bearer token on every request if one is available.
api.interceptors.request.use(
  (config) => {
    if (_accessToken) {
      config.headers['Authorization'] = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    const message = error.response?.data?.message || error.response?.data?.error || 'An unexpected error occurred';

    if (status === 401) {
      clearToken();
      if (window.location.pathname !== '/login') {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
    } else if (status === 403) {
      toast.error('You do not have permission to do that.');
    } else if (status === 429) {
      toast.error('Too many requests. Please wait a moment and try again.');
    } else if (status >= 500) {
      toast.error('Something went wrong on our end. Please try again shortly.');
    } else if (status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
