import { useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * Custom hook for making authenticated API requests
 * Automatically handles JWT tokens and token refresh on 401 responses
 * @returns {Object} API methods (get, post, put, delete, etc.)
 */
export function useApi() {
  const { getToken, refreshAccessToken } = useAuth();

  /**
   * Build full API URL
   * @param {string} endpoint - API endpoint path
   * @returns {string} Full API URL
   */
  const buildUrl = useCallback((endpoint) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${path}`;
  }, []);

  /**
   * Build request headers with auth token
   * @returns {Object} Headers object
   */
  const getHeaders = useCallback(() => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }, [getToken]);

  /**
   * Make authenticated API request with automatic token refresh
   * @param {string} url - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   */
  const apiRequest = useCallback(
    async (url, options = {}) => {
      const timeout = import.meta.env.VITE_API_TIMEOUT || 30000;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          headers: getHeaders(),
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle 401 Unauthorized - attempt token refresh
        if (response.status === 401) {
          try {
            await refreshAccessToken();

            // Retry request with new token
            return apiRequest(url, options);
          } catch (refreshErr) {
            console.error('Token refresh failed:', refreshErr);
            throw new Error('Session expired. Please login again.');
          }
        }

        // Handle other error responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.detail || errorData.message || 'Request failed';
          const error = new Error(errorMessage);
          error.status = response.status;
          error.data = errorData;
          throw error;
        }

        // Handle success response
        if (response.status === 204) {
          return null;
        }

        const data = await response.json();
        return data;
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
    },
    [getHeaders, refreshAccessToken]
  );

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response data
   */
  const get = useCallback(
    (endpoint, options = {}) => {
      return apiRequest(buildUrl(endpoint), {
        method: 'GET',
        ...options,
      });
    },
    [apiRequest, buildUrl]
  );

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response data
   */
  const post = useCallback(
    (endpoint, data = null, options = {}) => {
      return apiRequest(buildUrl(endpoint), {
        method: 'POST',
        ...(data && { body: JSON.stringify(data) }),
        ...options,
      });
    },
    [apiRequest, buildUrl]
  );

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response data
   */
  const put = useCallback(
    (endpoint, data = null, options = {}) => {
      return apiRequest(buildUrl(endpoint), {
        method: 'PUT',
        ...(data && { body: JSON.stringify(data) }),
        ...options,
      });
    },
    [apiRequest, buildUrl]
  );

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response data
   */
  const patch = useCallback(
    (endpoint, data = null, options = {}) => {
      return apiRequest(buildUrl(endpoint), {
        method: 'PATCH',
        ...(data && { body: JSON.stringify(data) }),
        ...options,
      });
    },
    [apiRequest, buildUrl]
  );

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response data
   */
  const del = useCallback(
    (endpoint, options = {}) => {
      return apiRequest(buildUrl(endpoint), {
        method: 'DELETE',
        ...options,
      });
    },
    [apiRequest, buildUrl]
  );

  /**
   * Upload file via FormData
   * @param {string} endpoint - API endpoint
   * @param {File} file - File to upload
   * @param {Object} additionalData - Additional form data
   * @returns {Promise<Object>} Response data
   */
  const uploadFile = useCallback(
    async (endpoint, file, additionalData = {}) => {
      const formData = new FormData();
      formData.append('file', file);

      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      return apiRequest(buildUrl(endpoint), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData,
      });
    },
    [apiRequest, buildUrl, getToken]
  );

  return {
    get,
    post,
    put,
    patch,
    delete: del,
    uploadFile,
    apiRequest,
  };
}

export default useApi;
