/**
 * Storage Service
 * Manages browser local/session storage for application data
 */

const STORAGE_PREFIX = 'credit_risk_';

/**
 * Get storage key with prefix
 * @param {string} key - Storage key
 * @returns {string}
 */
const getKey = (key) => `${STORAGE_PREFIX}${key}`;

/**
 * Set value in localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store (will be JSON stringified)
 * @param {number} expiryMinutes - Optional expiry time in minutes
 */
export const setLocalStorage = (key, value, expiryMinutes = null) => {
  try {
    const data = {
      value,
      timestamp: Date.now(),
    };

    if (expiryMinutes) {
      data.expiry = Date.now() + expiryMinutes * 60 * 1000;
    }

    localStorage.setItem(getKey(key), JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to set localStorage key "${key}":`, err);
  }
};

/**
 * Get value from localStorage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if not found
 * @returns {any}
 */
export const getLocalStorage = (key, defaultValue = null) => {
  try {
    const data = localStorage.getItem(getKey(key));

    if (!data) {
      return defaultValue;
    }

    const parsed = JSON.parse(data);

    // Check if expired
    if (parsed.expiry && parsed.expiry < Date.now()) {
      removeLocalStorage(key);
      return defaultValue;
    }

    return parsed.value;
  } catch (err) {
    console.error(`Failed to get localStorage key "${key}":`, err);
    return defaultValue;
  }
};

/**
 * Remove value from localStorage
 * @param {string} key - Storage key
 */
export const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(getKey(key));
  } catch (err) {
    console.error(`Failed to remove localStorage key "${key}":`, err);
  }
};

/**
 * Clear all localStorage items with our prefix
 */
export const clearLocalStorage = () => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.error('Failed to clear localStorage:', err);
  }
};

/**
 * Set value in sessionStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
export const setSessionStorage = (key, value) => {
  try {
    sessionStorage.setItem(getKey(key), JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to set sessionStorage key "${key}":`, err);
  }
};

/**
 * Get value from sessionStorage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if not found
 * @returns {any}
 */
export const getSessionStorage = (key, defaultValue = null) => {
  try {
    const data = sessionStorage.getItem(getKey(key));

    if (!data) {
      return defaultValue;
    }

    return JSON.parse(data);
  } catch (err) {
    console.error(`Failed to get sessionStorage key "${key}":`, err);
    return defaultValue;
  }
};

/**
 * Remove value from sessionStorage
 * @param {string} key - Storage key
 */
export const removeSessionStorage = (key) => {
  try {
    sessionStorage.removeItem(getKey(key));
  } catch (err) {
    console.error(`Failed to remove sessionStorage key "${key}":`, err);
  }
};

/**
 * Clear all sessionStorage items with our prefix
 */
export const clearSessionStorage = () => {
  try {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.error('Failed to clear sessionStorage:', err);
  }
};

/**
 * Get all localStorage items with our prefix (for debugging)
 * @returns {Object}
 */
export const getAllLocalStorage = () => {
  const items = {};

  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(STORAGE_PREFIX)) {
      const cleanKey = key.replace(STORAGE_PREFIX, '');
      try {
        items[cleanKey] = getLocalStorage(cleanKey);
      } catch (err) {
        console.error(`Failed to parse localStorage key "${cleanKey}":`, err);
      }
    }
  });

  return items;
};

/**
 * Store form data (for draft recovery)
 * @param {string} formId - Form identifier
 * @param {Object} data - Form data
 */
export const saveFormDraft = (formId, data) => {
  setLocalStorage(`form_draft_${formId}`, data, 24 * 60); // 24 hours
};

/**
 * Get stored form draft
 * @param {string} formId - Form identifier
 * @returns {Object}
 */
export const getFormDraft = (formId) => {
  return getLocalStorage(`form_draft_${formId}`, null);
};

/**
 * Clear form draft
 * @param {string} formId - Form identifier
 */
export const clearFormDraft = (formId) => {
  removeLocalStorage(`form_draft_${formId}`);
};

/**
 * Store API response cache
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Response data
 * @param {number} minutesToExpire - Cache expiry time in minutes
 */
export const cacheAPIResponse = (endpoint, data, minutesToExpire = 60) => {
  setLocalStorage(`cache_${endpoint}`, data, minutesToExpire);
};

/**
 * Get cached API response
 * @param {string} endpoint - API endpoint
 * @returns {Object}
 */
export const getCachedAPIResponse = (endpoint) => {
  return getLocalStorage(`cache_${endpoint}`, null);
};

/**
 * Clear API response cache
 * @param {string} endpoint - API endpoint
 */
export const clearAPICache = (endpoint) => {
  removeLocalStorage(`cache_${endpoint}`);
};

/**
 * Clear all API cache
 */
export const clearAllAPICache = () => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(STORAGE_PREFIX + 'cache_')) {
      localStorage.removeItem(key);
    }
  });
};

export default {
  setLocalStorage,
  getLocalStorage,
  removeLocalStorage,
  clearLocalStorage,
  setSessionStorage,
  getSessionStorage,
  removeSessionStorage,
  clearSessionStorage,
  getAllLocalStorage,
  saveFormDraft,
  getFormDraft,
  clearFormDraft,
  cacheAPIResponse,
  getCachedAPIResponse,
  clearAPICache,
  clearAllAPICache,
};
