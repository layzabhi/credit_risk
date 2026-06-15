/**
 * Formatters Utility
 * Formatting functions for numbers, dates, and text
 */

/**
 * Format currency value
 * @param {number} value - Value to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string}
 */
export const formatCurrency = (value, currency = 'USD') => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(value);
};

/**
 * Format percentage
 * @param {number} value - Value (0-1 or 0-100)
 * @param {number} decimals - Number of decimal places
 * @returns {string}
 */
export const formatPercentage = (value, decimals = 2) => {
  const percentage = value > 1 ? value : value * 100;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Format number with comma separators
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string}
 */
export const formatNumber = (value, decimals = 0) => {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(value);
};

/**
 * Format date to string
 * @param {Date|string} date - Date to format
 * @param {string} format - Format pattern ('short', 'long', 'full', or custom)
 * @returns {string}
 */
export const formatDate = (date, format = 'short') => {
  const dateObj = new Date(date);

  const options = {
    short: { year: '2-digit', month: '2-digit', day: '2-digit' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  };

  if (options[format]) {
    return dateObj.toLocaleDateString('en-US', options[format]);
  }

  return dateObj.toLocaleDateString('en-US');
};

/**
 * Format date and time
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export const formatDateTime = (date) => {
  const dateObj = new Date(date);
  const dateStr = formatDate(dateObj, 'short');
  const timeStr = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${dateStr} ${timeStr}`;
};

/**
 * Format time difference (e.g., "2 hours ago")
 * @param {Date|string} date - Past date
 * @returns {string}
 */
export const formatTimeAgo = (date) => {
  const dateObj = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now - dateObj) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }

  return 'just now';
};

/**
 * Format text to title case
 * @param {string} text - Text to format
 * @returns {string}
 */
export const formatTitleCase = (text) => {
  return text
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Format snake_case to readable text
 * @param {string} text - Text to format
 * @returns {string}
 */
export const formatReadable = (text) => {
  return text
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format risk level with color
 * @param {string} riskLevel - Risk level (low, medium, high)
 * @returns {Object} { color: string, label: string }
 */
export const formatRiskLevel = (riskLevel) => {
  const riskLower = riskLevel?.toLowerCase();
  const riskMap = {
    low: { color: 'text-green-600', label: 'Low Risk', bgColor: 'bg-green-50' },
    medium: { color: 'text-yellow-600', label: 'Medium Risk', bgColor: 'bg-yellow-50' },
    high: { color: 'text-red-600', label: 'High Risk', bgColor: 'bg-red-50' },
  };

  return riskMap[riskLower] || { color: 'text-gray-600', label: 'Unknown', bgColor: 'bg-gray-50' };
};

/**
 * Format score to rating badge
 * @param {number} score - Score (0-1 or 0-100)
 * @returns {string}
 */
export const formatScore = (score) => {
  const scoreValue = score > 1 ? score / 100 : score;
  const percentage = (scoreValue * 100).toFixed(1);

  if (scoreValue >= 0.7) return `Excellent (${percentage}%)`;
  if (scoreValue >= 0.5) return `Good (${percentage}%)`;
  if (scoreValue >= 0.3) return `Fair (${percentage}%)`;
  return `Poor (${percentage}%)`;
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string}
 */
export const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }

  return phone;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} length - Max length
 * @returns {string}
 */
export const truncateText = (text, length = 50) => {
  if (text.length <= length) return text;
  return text.substring(0, length - 3) + '...';
};

/**
 * Format JSON for display
 * @param {Object} obj - Object to format
 * @param {number} spaces - Indentation spaces
 * @returns {string}
 */
export const formatJSON = (obj, spaces = 2) => {
  return JSON.stringify(obj, null, spaces);
};

export default {
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatDate,
  formatDateTime,
  formatTimeAgo,
  formatTitleCase,
  formatReadable,
  formatRiskLevel,
  formatScore,
  formatFileSize,
  formatPhone,
  truncateText,
  formatJSON,
};
