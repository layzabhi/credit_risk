import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook to use authentication context
 * @throws {Error} If used outside AuthProvider
 * @returns {Object} AuthContext value with auth state and methods
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

export default useAuth;
