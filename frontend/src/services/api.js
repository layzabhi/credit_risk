/**
 * API Client Service
 * 
 * Centralized HTTP client for all API calls.
 * Handles authentication, error handling, and request/response transformations.
 */

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
const TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '30000');

// Create axios instance
const client = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses and errors globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service methods
export const apiService = {
  // Scoring endpoints
  scoring: {
    scoreApplicant: (data) =>
      client.post('/score', data),
    scoreBatch: (data) =>
      client.post('/score/batch', data),
    getHistory: (applicantId, limit = 10) =>
      client.get(`/score/history/${applicantId}`, { params: { limit } }),
  },

  // Batch endpoints
  batch: {
    upload: (file, jobName = '') => {
      const formData = new FormData();
      formData.append('file', file);
      if (jobName) formData.append('job_name', jobName);
      return client.post('/batch/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    getStatus: (jobId) =>
      client.get(`/batch/${jobId}`),
    getResults: (jobId, limit = 100, offset = 0) =>
      client.get(`/batch/${jobId}/results`, {
        params: { limit, offset },
      }),
    getSummary: (jobId) =>
      client.get(`/batch/${jobId}/summary`),
    cancel: (jobId) =>
      client.post(`/batch/${jobId}/cancel`),
    download: (jobId, format = 'csv') =>
      client.get(`/batch/${jobId}/download`, {
        params: { format },
        responseType: 'blob',
      }),
    list: (status = '', limit = 20, offset = 0) =>
      client.get('/batch/', { params: { status, limit, offset } }),
  },

  // Explainability endpoints
  explain: {
    getExplanation: (requestId) =>
      client.get(`/explain/${requestId}`),
    getWaterfall: (requestId) =>
      client.get(`/explain/${requestId}/waterfall`),
    getForcePlot: (requestId) =>
      client.get(`/explain/${requestId}/force-plot`),
    regenerate: (requestId) =>
      client.post(`/explain/regenerate/${requestId}`),
    getModelImportance: (modelVersion) =>
      client.get(`/explain/model/${modelVersion}/importance`),
  },

  // Governance endpoints
  governance: {
    listModels: (status = '') =>
      client.get('/governance/models', { params: { status } }),
    getModelInfo: (modelId) =>
      client.get(`/governance/models/${modelId}`),
    promoteModel: (modelId) =>
      client.post(`/governance/models/${modelId}/promote`),
    rollbackModel: (modelId) =>
      client.post(`/governance/models/${modelId}/rollback`),
    compareModels: (modelIds) =>
      client.get('/governance/models/compare', {
        params: { model_ids: modelIds },
      }),
    getAuditLogs: (eventType = '', days = 7, limit = 100, offset = 0) =>
      client.get('/governance/audit', {
        params: { event_type: eventType, days, limit, offset },
      }),
    exportAuditLogs: (startDate, endDate, format = 'csv') =>
      client.get('/governance/audit/export', {
        params: { start_date: startDate, end_date: endDate, format },
        responseType: 'blob',
      }),
    getAuditSummary: (days = 7) =>
      client.get('/governance/audit/summary', { params: { days } }),
    getFairnessReport: (modelId, protectedAttributes = ['gender', 'age']) =>
      client.get('/governance/fairness-report', {
        params: { model_id: modelId, protected_attributes: protectedAttributes },
      }),
    getPerformanceReport: (modelId) =>
      client.get('/governance/performance-report', {
        params: { model_id: modelId },
      }),
  },

  // Health check
  health: () =>
    client.get('/health'),
};

export default client;