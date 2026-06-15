import React, { useState } from 'react';
import BatchUpload from '../components/BatchUpload';
import BatchResults from '../components/BatchResults';

/**
 * BatchPage - Batch processing for portfolio-level credit risk assessment
 */
export function BatchPage() {
  const [activeJobId, setActiveJobId] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [jobCreated, setJobCreated] = useState(false);

  const handleJobCreated = (jobId) => {
    setActiveJobId(jobId);
    setJobCreated(true);
    // Refresh job list
    setTimeout(() => setJobCreated(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Batch Processing</h1>
        <p className="text-gray-600 mt-1">Upload CSV files for portfolio-level credit risk assessment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload File</h2>
            <BatchUpload onJobCreated={handleJobCreated} />
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {activeJobId && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Batch Results</h2>
                {jobCreated && (
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    Job created successfully
                  </span>
                )}
              </div>
              <BatchResults jobId={activeJobId} />
            </div>
          )}

          {!activeJobId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
              <p className="text-blue-800">
                Upload a CSV file on the left to process a batch of applications. The results will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Jobs</h2>
        <div className="space-y-2">
          {recentJobs.length > 0 ? (
            recentJobs.map(job => (
              <button
                key={job.id}
                onClick={() => setActiveJobId(job.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeJobId === job.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{job.name || `Job ${job.id}`}</p>
                    <p className="text-sm text-gray-600">{job.record_count} records • {new Date(job.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    job.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : job.status === 'processing'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <p className="text-gray-600 text-center py-8">No recent jobs</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default BatchPage;
