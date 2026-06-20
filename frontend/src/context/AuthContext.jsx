import React, { createContext, useCallback, useEffect, useState } from 'react';

/**
 * AuthContext provides authentication state and methods
 * Handles JWT tokens, user sessions, and login/logout operations
 */
export const AuthContext = createContext(null);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const REFRESH_TOKEN_KEY = 'refresh_token';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const MOCK_USERS_KEY = 'mock_users';

const getMockUsers = () => {
  const users = localStorage.getItem(MOCK_USERS_KEY);
  if (!users) {
    const defaultUsers = [
      {
        id: "default-admin",
        username: "admin",
        email: "admin.risklens@gmail.com",
        password: "risklens123",
        first_name: "Super",
        last_name: "Admin",
        roles: ["admin"],
        role: "admin",
        permissions: ["score", "batch_process", "manage_models", "view_audit_log"]
      }
    ];
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  return JSON.parse(users);
};

/**
 * AuthProvider component
 * Manages authentication state and provides it to child components
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Clear all authentication state
   */
  const clearAuthState = useCallback(() => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    setError(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    // Seed mock users if not present
    const seedMockUsers = () => {
      const mockUsers = localStorage.getItem(MOCK_USERS_KEY);
      if (!mockUsers) {
        const defaultUsers = [
          {
            id: "default-admin",
            username: "admin",
            email: "admin.risklens@gmail.com",
            password: "risklens123",
            first_name: "Super",
            last_name: "Admin",
            roles: ["admin"],
            role: "admin",
            permissions: ["score", "batch_process", "manage_models", "view_audit_log"]
          }
        ];
        localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(defaultUsers));
      }
    };
    seedMockUsers();

    const initializeAuth = () => {
      try {
        let savedToken = localStorage.getItem(TOKEN_KEY);
        let savedUser = localStorage.getItem(USER_KEY);
        let savedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          setRefreshToken(savedRefreshToken);
          setIsAuthenticated(true);
        } else {
          clearAuthState();
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [clearAuthState]);

  /**
   * Login user with credentials
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data on success
   */
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      let data;
      try {
        const response = await fetch(
          `${API_BASE_URL}/v1/auth/login`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include',
          }
        );

        if (response.ok) {
          data = await response.json();
        } else if (response.status === 404) {
          console.log('Auth API not found, falling back to mock auth');
          throw new Error('MOCK_AUTH');
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Login failed');
        }
      } catch (fetchErr) {
        if (fetchErr.message === 'MOCK_AUTH' || fetchErr instanceof TypeError) {
          // Network connection error or 404 fallback
          const mockUsers = getMockUsers();
          const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

          if (!existingUser) {
            throw new Error('Please signup first!');
          }

          if (existingUser.password !== password) {
            throw new Error('Incorrect password.');
          }

          data = {
            access_token: 'mock-jwt-token-for-development',
            refresh_token: 'mock-refresh-token',
            user: {
              id: existingUser.id || 'default-admin',
              username: existingUser.username || existingUser.email.split('@')[0],
              email: existingUser.email,
              first_name: existingUser.first_name,
              last_name: existingUser.last_name,
              roles: existingUser.roles || ['admin', 'user'],
              permissions: existingUser.permissions || ['score', 'batch_process', 'manage_models', 'view_audit_log']
            }
          };
        } else {
          throw fetchErr;
        }
      }

      // Store auth data
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token || '');
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      // Update state
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setUser(data.user);
      setIsAuthenticated(true);

      return data.user;
    } catch (err) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      clearAuthState();
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthState]);

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User data on success
   */
  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      let data;
      try {
        const response = await fetch(
          `${API_BASE_URL}/v1/auth/register`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('MOCK_AUTH');
          }
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Registration failed');
        }

        data = await response.json();
      } catch (fetchErr) {
        if (fetchErr.message === 'MOCK_AUTH' || fetchErr instanceof TypeError) {
          // Network connection error or 404 fallback
          const mockUsers = getMockUsers();
          const emailExists = mockUsers.some(u => u.email.toLowerCase() === userData.email.toLowerCase());
          if (emailExists) {
            throw new Error('Email already registered.');
          }

          const newUser = {
            id: `mock-user-${Date.now()}`,
            username: userData.email.split('@')[0],
            email: userData.email,
            password: userData.password,
            first_name: userData.first_name,
            last_name: userData.last_name,
            roles: ['analyst'],
            role: 'analyst',
            permissions: ['score']
          };

          mockUsers.push(newUser);
          localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(mockUsers));

          data = newUser;
        } else {
          throw fetchErr;
        }
      }
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh access token using refresh token
   * @returns {Promise<string>} New access token
   */
  const refreshAccessToken = useCallback(async () => {
    try {
      const rt = refreshToken || localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!rt) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(
        `${API_BASE_URL}/v1/auth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${rt}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      // Update token
      localStorage.setItem(TOKEN_KEY, data.access_token);
      setToken(data.access_token);

      return data.access_token;
    } catch (err) {
      console.error('Token refresh failed:', err);
      clearAuthState();
      throw err;
    }
  }, [refreshToken, clearAuthState]);

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      // Optional: Notify backend of logout
      if (token) {
        try {
          await fetch(
            `${API_BASE_URL}/v1/auth/logout`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
        } catch (err) {
          console.error('Error notifying backend of logout:', err);
        }
      }
    } finally {
      clearAuthState();
      setIsLoading(false);
    }
  }, [token, clearAuthState]);

  /**
   * Update user profile
   * @param {Object} profileData - Updated user data
   * @returns {Promise<Object>} Updated user data
   */
  const updateProfile = useCallback(async (profileData) => {
    setIsLoading(true);
    setError(null);

    try {
      let data;
      try {
        if (token === 'mock-jwt-token-for-development') {
          throw new Error('MOCK_AUTH');
        }

        const response = await fetch(
          `${API_BASE_URL}/v1/auth/profile`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(profileData),
          }
        );

        if (response.ok) {
          data = await response.json();
        } else if (response.status === 404) {
          throw new Error('MOCK_AUTH');
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Update failed');
        }
      } catch (fetchErr) {
        if (fetchErr.message === 'MOCK_AUTH' || fetchErr instanceof TypeError) {
          // Network connection error or 404 fallback for mock dev
          const mockUsers = getMockUsers();
          const userIndex = mockUsers.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
          if (userIndex !== -1) {
            mockUsers[userIndex] = {
              ...mockUsers[userIndex],
              first_name: profileData.first_name,
              last_name: profileData.last_name,
              email: profileData.email,
            };
            localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(mockUsers));
          }

          data = {
            ...user,
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            email: profileData.email,
          };
        } else {
          throw fetchErr;
        }
      }

      // Update user state
      localStorage.setItem(USER_KEY, JSON.stringify(data));
      setUser(data);

      return data;
    } catch (err) {
      const errorMessage = err.message || 'Profile update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  const requestPasswordReset = useCallback(async (email) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/auth/password-reset`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Request failed');
      }
    } catch (err) {
      const errorMessage = err.message || 'Password reset request failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Confirm password reset
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  const confirmPasswordReset = useCallback(async (resetToken, newPassword) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/auth/password-reset/confirm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, new_password: newPassword }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Reset failed');
      }
    } catch (err) {
      const errorMessage = err.message || 'Password reset failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check if user has specific role
   * @param {string|Array<string>} roles - Role(s) to check
   * @returns {boolean} True if user has role
   */
  const hasRole = useCallback((roles) => {
    if (!user || !user.roles) return false;

    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.some(role => user.roles?.includes(role));
  }, [user]);

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  const hasPermission = useCallback((permission) => {
    if (!user || !user.permissions) return false;

    return user.permissions.includes(permission);
  }, [user]);

  /**
   * Get authentication token
   * @returns {string|null} Current JWT token
   */
  const getToken = useCallback(() => {
    return token || localStorage.getItem(TOKEN_KEY);
  }, [token]);

  const value = {
    // State
    user,
    token,
    refreshToken,
    isLoading,
    isAuthenticated,
    error,

    // Methods
    login,
    logout,
    register,
    updateProfile,
    refreshAccessToken,
    requestPasswordReset,
    confirmPasswordReset,
    hasRole,
    hasPermission,
    getToken,
    clearAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
