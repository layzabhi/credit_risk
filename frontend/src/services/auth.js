/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls
 * This service is used by the AuthContext for auth operations
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 30000;

/**
 * Fetch with timeout
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Login response with tokens and user data
 */
export const loginUser = async (email, password) => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  return response.json();
};

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registration response
 */
export const registerUser = async (userData) => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }

  return response.json();
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New access token
 */
export const refreshToken = async (refreshToken) => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${refreshToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  return response.json();
};

/**
 * Logout user
 * @param {string} token - Access token
 * @returns {Promise<void>}
 */
export const logoutUser = async (token) => {
  try {
    await fetchWithTimeout(`${API_BASE_URL}/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Don't throw, logout should succeed even if backend call fails
  }
};

/**
 * Get current user profile
 * @param {string} token - Access token
 * @returns {Promise<Object>} User profile
 */
export const getCurrentUser = async (token) => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/v1/auth/profile`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return response.json();
};

/**
 * Update user profile
 * @param {string} token - Access token
 * @param {Object} profileData - Updated profile data
 * @returns {Promise<Object>} Updated user profile
 */
export const updateUserProfile = async (token, profileData) => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/v1/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Profile update failed');
  }

  return response.json();
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<Object>} Reset request response
 */
export const requestPasswordReset = async (email) => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/v1/auth/password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Password reset request failed');
  }

  return response.json();
};

/**
 * Confirm password reset
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export const confirmPasswordReset = async (token, newPassword) => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/v1/auth/password-reset/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Password reset failed');
  }

  return response.json();
};

/**
 * Change password
 * @param {string} token - Access token
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export const changePassword = async (token, currentPassword, newPassword) => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/v1/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Password change failed');
  }

  return response.json();
};

/**
 * Enable two-factor authentication
 * @param {string} token - Access token
 * @returns {Promise<Object>} 2FA setup response with QR code
 */
export const enableTwoFactor = async (token) => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/v1/auth/2fa/enable`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '2FA setup failed');
  }

  return response.json();
};

/**
 * Verify two-factor authentication code
 * @param {string} token - Access token
 * @param {string} code - 2FA code
 * @returns {Promise<Object>} Verification response with recovery codes
 */
export const verifyTwoFactor = async (token, code) => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/v1/auth/2fa/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '2FA verification failed');
  }

  return response.json();
};

/**
 * Disable two-factor authentication
 * @param {string} token - Access token
 * @returns {Promise<void>}
 */
export const disableTwoFactor = async (token) => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/v1/auth/2fa/disable`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to disable 2FA');
  }

  return response.json();
};

/**
 * Get user sessions
 * @param {string} token - Access token
 * @returns {Promise<Array>} List of active sessions
 */
export const getUserSessions = async (token) => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/v1/auth/sessions`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }

  return response.json();
};

/**
 * Revoke a session
 * @param {string} token - Access token
 * @param {string} sessionId - Session ID to revoke
 * @returns {Promise<void>}
 */
export const revokeSession = async (token, sessionId) => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/v1/auth/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to revoke session');
  }
};

/**
 * Revoke all sessions
 * @param {string} token - Access token
 * @returns {Promise<void>}
 */
export const revokeAllSessions = async (token) => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/v1/auth/sessions`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to revoke sessions');
  }
};

export default {
  loginUser,
  registerUser,
  refreshToken,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  requestPasswordReset,
  confirmPasswordReset,
  changePassword,
  enableTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
  getUserSessions,
  revokeSession,
  revokeAllSessions,
};
