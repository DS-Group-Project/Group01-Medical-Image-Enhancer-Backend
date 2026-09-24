import api, { setToken, clearToken } from './api';

/**
 * Service for handling authentication related API calls.
 *
 * The backend issues a JWT Bearer token on login/register.
 * We store it in the in-memory module variable inside api.js (never in
 * localStorage) and attach it automatically via the Axios request interceptor.
 */
export const authService = {
  /**
   * Logs in a user. Stores the returned token in memory.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{user: Object, token: string}>}
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data;
    if (token) setToken(token);
    return { user };
  },

  /**
   * Registers a new user. Stores the returned token in memory.
   *
   * @param {Object} userData - { name, email, password }
   * @returns {Promise<{user: Object}>}
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    const { user, token } = response.data;
    if (token) setToken(token);
    return { user };
  },

  /**
   * Logs out the current user. Clears the in-memory token.
   */
  logout: async () => {
    clearToken();
    // No server-side logout call needed for stateless JWT
  },

  /**
   * Retrieves the current authenticated user's details.
   * A 401 response means no valid token → user is not logged in.
   *
   * @returns {Promise<{user: Object}>}
   */
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default authService;
