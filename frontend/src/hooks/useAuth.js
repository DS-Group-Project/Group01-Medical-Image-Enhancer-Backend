import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook to consume the AuthContext.
 * Throws an error if used outside of an AuthProvider.
 * 
 * @returns {Object} The auth context value { user, isAuthenticated, isLoading, login, register, logout }
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
