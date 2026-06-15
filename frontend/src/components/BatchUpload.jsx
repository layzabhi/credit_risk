/**
 * BatchUpload Component
 * 
 * Handles CSV file upload for portfolio-level credit risk assessment.
 * Features:
 * - File drag-and-drop
 * - Validation before upload
 * - Progress tracking
 * - Job status monitoring
 */

import React, { useState } from 'react';
import axios from 'axios';
import { Upload, AlertCircle, CheckCircle, Loader, Download } from 'lucide-react';

const BatchUpload = ({ onJobCreated }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [jobName, setJobName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [progress, setProgress] = useState(0);

  // CSV validation
  const validateFile = (file) => {
    if (!file.name.endsWith('.csv')) {
      return { valid: false, error: 'File must be CSV format' };
    }
    if (file.size > 100 * 1024 * 1024) {
      return { valid: false, error: 'File too large (max 100MB)' };
    }
    return { valid: true };
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const validation = validateFile(files[0]);
      if (validation.valid) {
        setFile(files[0]);
        setError(null);
      } else {
        setError(validation.error);
      }
    }
  };

  // Handle file input
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFile(file);
      if (validation.valid) {
        setFile(file);
        setError(null);
      } else {
        setError(validation.error);
      }
    }
  };

  // Upload file
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (jobName) {
        formData.append('job_name', jobName);
      }

      const response = await axios.post('/api/v1/batch/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setJobId(response.data.job_id);
      setJobStatus(response.data);

      if (onJobCreated) {
        onJobCreated(response.data);
      }

      // Poll for status
      pollJobStatus(response.data.job_id);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll job status
  const pollJobStatus = async (jobId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/v1/batch/${jobId}`);
        setJobStatus(response.data);
        setProgress(
          (response.data.processed_records / response.data.total_records) * 100
        );

        if (
          response.data.status === 'completed' ||
          response.data.status === 'failed'
        ) {
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Status poll error:', err);
      }
    }, 2000);
  };

  // Download results
  const handleDownload = async () => {
    try {
      const response = await axios.get(
        `/api/v1/batch/${jobId}/download?format=csv`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `batch_results_${jobId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to download results');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Portfolio Batch Processing</h2>

      {!jobId ? (
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* File Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-lg font-semibold mb-2">
              Drop your CSV file here
            </p>
            <p className="text-sm text-gray-600 mb-4">
              or click to browse (max 100MB)
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
            >
              Select File
            </label>
          </div>

          {/* Selected File */}
          {file && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-semibold text-blue-900">
                Selected: {file.name}
              </p>
              <p className="text-xs text-blue-700">
                Size: {(file.size / 1024 / 1024).toFixed(2)}MB
              </p>
            </div>
          )}

          {/* Job Name */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Name (Optional)
            </label>
            <input
              type="text"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              placeholder="e.g., Q2_2026_Portfolio"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={20} />
                Upload & Process
              </>
            )}
          </button>
        </div>
      ) : (
        // Job Status
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            {jobStatus?.status === 'completed' ? (
              <CheckCircle className="text-green-600" size={32} />
            ) : jobStatus?.status === 'failed' ? (
              <AlertCircle className="text-red-600" size={32} />
            ) : (
              <Loader className="text-blue-600 animate-spin" size={32} />
            )}
            <div>
              <h3 className="text-xl font-bold capitalize">
                {jobStatus?.status}
              </h3>
              <p className="text-sm text-gray-600">{jobStatus?.job_name}</p>
            </div>
          </div>

          {/* Progress */}
          {jobStatus?.status === 'processing' && (
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">Progress</span>
                <span className="text-sm">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {jobStatus?.processed_records} / {jobStatus?.total_records}{' '}
                records processed
              </p>
            </div>
          )}

          {/* Summary Metrics */}
          {jobStatus?.summary_metrics && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded">
                <p className="text-xs text-gray-600">Low Risk</p>
                <p className="text-2xl font-bold text-green-600">
                  {jobStatus.summary_metrics.ratings_distribution?.Low || 0}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded">
                <p className="text-xs text-gray-600">Medium Risk</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {jobStatus.summary_metrics.ratings_distribution?.Medium || 0}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded">
                <p className="text-xs text-gray-600">High Risk</p>
                <p className="text-2xl font-bold text-red-600">
                  {jobStatus.summary_metrics.ratings_distribution?.High || 0}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-xs text-gray-600">Avg Probability</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(
                    jobStatus.summary_metrics.mean_probability * 100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {jobStatus?.status === 'completed' && (
              <button
                onClick={handleDownload}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download Results
              </button>
            )}
            <button
              onClick={() => {
                setJobId(null);
                setJobStatus(null);
                setFile(null);
                setProgress(0);
              }}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
            >
              New Upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchUpload;