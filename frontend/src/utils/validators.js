/**
 * Validators Utility
 * Form validation functions for credit risk assessment
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate age range
 * @param {number} age - Age to validate
 * @param {number} min - Minimum age
 * @param {number} max - Maximum age
 * @returns {boolean}
 */
export const isValidAge = (age, min = 18, max = 100) => {
  const ageNum = parseInt(age);
  return !isNaN(ageNum) && ageNum >= min && ageNum <= max;
};

/**
 * Validate income
 * @param {number} income - Income to validate
 * @returns {boolean}
 */
export const isValidIncome = (income) => {
  const incomeNum = parseFloat(income);
  return !isNaN(incomeNum) && incomeNum > 0;
};

/**
 * Validate credit score
 * @param {number} creditScore - Credit score to validate
 * @returns {boolean}
 */
export const isValidCreditScore = (creditScore) => {
  const score = parseInt(creditScore);
  return !isNaN(score) && score >= 300 && score <= 850;
};

/**
 * Validate loan amount
 * @param {number} loanAmount - Loan amount to validate
 * @returns {boolean}
 */
export const isValidLoanAmount = (loanAmount) => {
  const amount = parseFloat(loanAmount);
  return !isNaN(amount) && amount > 0;
};

/**
 * Validate debt-to-income ratio
 * @param {number} dtiRatio - DTI ratio to validate
 * @returns {boolean}
 */
export const isValidDTIRatio = (dtiRatio) => {
  const ratio = parseFloat(dtiRatio);
  return !isNaN(ratio) && ratio >= 0 && ratio <= 1;
};

/**
 * Validate years at job
 * @param {number} years - Years at job to validate
 * @returns {boolean}
 */
export const isValidYearsAtJob = (years) => {
  const yearsNum = parseInt(years);
  return !isNaN(yearsNum) && yearsNum >= 0 && yearsNum <= 60;
};

/**
 * Validate number of dependents
 * @param {number} dependents - Number of dependents to validate
 * @returns {boolean}
 */
export const isValidDependents = (dependents) => {
  const depNum = parseInt(dependents);
  return !isNaN(depNum) && depNum >= 0 && depNum <= 10;
};

/**
 * Validate previous defaults
 * @param {number} defaults - Number of previous defaults to validate
 * @returns {boolean}
 */
export const isValidDefaults = (defaults) => {
  const defaultNum = parseInt(defaults);
  return !isNaN(defaultNum) && defaultNum >= 0;
};

/**
 * Validate CSV file
 * @param {File} file - File to validate
 * @returns {Object} { isValid: boolean, error: string | null }
 */
export const validateCSVFile = (file) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  if (!file.name.endsWith('.csv')) {
    return { isValid: false, error: 'File must be in CSV format' };
  }

  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must not exceed 100MB' };
  }

  return { isValid: true, error: null };
};

/**
 * Validate required fields
 * @param {Object} data - Data object to validate
 * @param {string[]} requiredFields - Required field names
 * @returns {Object} { isValid: boolean, missingFields: string[] }
 */
export const validateRequiredFields = (data, requiredFields) => {
  const missingFields = requiredFields.filter(field => !data[field]);

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export default {
  isValidEmail,
  validatePassword,
  isValidAge,
  isValidIncome,
  isValidCreditScore,
  isValidLoanAmount,
  isValidDTIRatio,
  isValidYearsAtJob,
  isValidDependents,
  isValidDefaults,
  validateCSVFile,
  validateRequiredFields,
  isValidPhone,
  isValidURL,
};
