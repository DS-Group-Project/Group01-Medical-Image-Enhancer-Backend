import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/authService';
import { mockAuthService } from '../services/mockData';
import { getToken } from '../services/api';

export const AuthContext = createContext(null);

/**
 * Custom hook to consume the AuthContext.
 * Throws an error if used outside of an AuthProvider.
 */
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Only ever use the mock service when explicitly opted in via env var.
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const activeAuthService = USE_MOCK ? mockAuthService : authService;

// Auto-logout after 15 minutes of inactivity.
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'];

/**
 * AuthProvider component that wraps the application to provide authentication context.
 *
 * Auth state is driven by the in-memory JWT. Since the token is lost on page
 * reload (by design — no localStorage), users must log in again after a full
 * page refresh. This is the correct security behaviour for a medical app.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const idleTimerRef = useRef(null);

  const refreshSession = useCallback(async () => {
    // If no token is in memory there's nothing to check — don't hit the server.
    if (!getToken()) {
      return false;
    }
    try {
      const data = await activeAuthService.getCurrentUser();
      setUser(data.user);
      setIsAuthenticated(true);
      return true;
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      await refreshSession();
      setIsLoading(false);
    };
    initAuth();
  }, [refreshSession]);

  const login = async (email, password) => {
    const data = await activeAuthService.login(email, password);
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const register = async (userData) => {
    const data = await activeAuthService.register(userData);
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const logout = useCallback(async (options = {}) => {
    try {
      await activeAuthService.logout();
    } catch {
      // Even if the server call fails, drop local auth state.
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      if (!options.silent) {
        window.location.href = '/login';
      }
    }
  }, []);

  // Idle-timeout auto logout, only while authenticated.
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        logout({ silent: true }).finally(() => {
          window.location.href = '/login?reason=idle';
        });
      }, IDLE_TIMEOUT_MS);
    };

    resetIdleTimer();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetIdleTimer));

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
    };
  }, [isAuthenticated, logout]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
