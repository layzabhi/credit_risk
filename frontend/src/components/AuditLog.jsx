/**
 * AuditLog Component
 * 
 * Displays audit trail for compliance and debugging.
 * Features:
 * - Event filtering and search
 * - Detailed event information
 * - Export capabilities
 * - Timeline view
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  Download,
  Filter,
  Search,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    eventType: 'all',
    status: 'all',
    days: 7,
    search: '',
  });
  const [expandedLog, setExpandedLog] = useState(null);

  // Load logs on mount and when filters change
  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {
        days: filters.days,
        limit: 50,
      };
      if (filters.eventType !== 'all') {
        params.event_type = filters.eventType;
      }

      const response = await axios.get('/api/v1/governance/audit', {
        params,
      });
      setLogs(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load audit logs');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter logs locally
  const filteredLogs = logs.filter((log) => {
    if (filters.status !== 'all' && log.status !== filters.status) {
      return false;
    }
    if (
      filters.search &&
      !log.action.toLowerCase().includes(filters.search.toLowerCase()) &&
      !log.event_type.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Export logs
  const handleExport = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - filters.days);
      const endDate = new Date();

      const response = await axios.get('/api/v1/governance/audit/export', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          format: 'csv',
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Export failed: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin">⏳</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center gap-2"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="grid grid-cols-4 gap-4">
          {/* Event Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type
            </label>
            <select
              value={filters.eventType}
              onChange={(e) =>
                setFilters({ ...filters, eventType: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Events</option>
              <option value="score">Scoring</option>
              <option value="batch">Batch Job</option>
              <option value="governance">Governance</option>
              <option value="error">Errors</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </div>

          {/* Days Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last N Days
            </label>
            <select
              value={filters.days}
              onChange={(e) =>
                setFilters({ ...filters, days: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Last 24 Hours</option>
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              placeholder="Event, action..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Logs List */}
      <div className="space-y-2">
        {filteredLogs.map((log) => (
          <div
            key={log.log_id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
          >
            <div
              className="p-4 cursor-pointer"
              onClick={() =>
                setExpandedLog(expandedLog === log.log_id ? null : log.log_id)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 flex items-start gap-3">
                  {log.status === 'success' ? (
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{log.action}</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-mono">
                        {log.event_type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {log.user_id ? `By ${log.user_id}` : 'System'} •{' '}
                      {new Date(log.timestamp).toLocaleString()}
                      {log.duration_ms && ` • ${log.duration_ms.toFixed(2)}ms`}
                    </p>
                  </div>
                </div>
                {log.error_message && (
                  <div className="ml-4 px-3 py-1 bg-red-100 text-red-700 text-xs rounded">
                    Error
                  </div>
                )}
              </div>

              {/* Details */}
              {expandedLog === log.log_id && (
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Log ID</p>
                    <p className="font-mono text-xs break-all">{log.log_id}</p>
                  </div>
                  {log.applicant_id && (
                    <div>
                      <p className="text-gray-600">Applicant</p>
                      <p className="font-mono text-xs">{log.applicant_id}</p>
                    </div>
                  )}
                  {log.job_id && (
                    <div>
                      <p className="text-gray-600">Job</p>
                      <p className="font-mono text-xs">{log.job_id}</p>
                    </div>
                  )}
                  {log.model_id && (
                    <div>
                      <p className="text-gray-600">Model</p>
                      <p className="font-mono text-xs">{log.model_id}</p>
                    </div>
                  )}
                  {log.error_message && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Error</p>
                      <p className="bg-red-50 p-2 rounded text-xs font-mono">
                        {log.error_message}
                      </p>
                    </div>
                  )}
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Details</p>
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600">No logs found</p>
        </div>
      )}
    </div>
  );
};

export default AuditLog;