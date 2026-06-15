import React, { useState } from 'react';
import { Download, Search, Filter, ChevronLeft, ChevronRight, Eye, AlertCircle } from 'lucide-react';

/**
 * BatchResults Component
 * Displays results from batch processing jobs
 */
export function BatchResults({ jobId, loading = false }) {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [expandedRow, setExpandedRow] = useState(null);
  const [jobSummary, setJobSummary] = useState(null);

  // Calculate pagination
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedResults = filteredResults.slice(startIdx, startIdx + itemsPerPage);

  // Filter and search
  React.useEffect(() => {
    let filtered = results;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        item =>
          item.applicant_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Risk filter
    if (filterRisk !== 'all') {
      filtered = filtered.filter(item => item.risk_level?.toLowerCase() === filterRisk.toLowerCase());
    }

    setFilteredResults(filtered);
    setCurrentPage(1);
  }, [results, searchTerm, filterRisk]);

  const getRiskBadgeColor = (risk) => {
    const riskLower = risk?.toLowerCase();
    if (riskLower === 'low') return 'bg-green-100 text-green-800';
    if (riskLower === 'medium') return 'bg-yellow-100 text-yellow-800';
    if (riskLower === 'high') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleDownload = (format = 'csv') => {
    // Implementation for download functionality
    console.log(`Downloading results as ${format}`);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
        <div className="h-80 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {jobSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Processed</p>
            <p className="text-3xl font-bold text-gray-900">{jobSummary.total_processed}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Low Risk</p>
            <p className="text-3xl font-bold text-green-600">{jobSummary.low_risk_count || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Medium Risk</p>
            <p className="text-3xl font-bold text-yellow-600">{jobSummary.medium_risk_count || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">High Risk</p>
            <p className="text-3xl font-bold text-red-600">{jobSummary.high_risk_count || 0}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search applicants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>

          {/* Filter */}
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>

        {/* Download Button */}
        <button
          onClick={() => handleDownload('csv')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Download Results
        </button>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Applicant ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Risk Level</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Score</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Decision</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResults.length > 0 ? (
                paginatedResults.map((result, idx) => (
                  <React.Fragment key={idx}>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{result.applicant_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{result.applicant_name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(result.risk_level)}`}>
                          {result.risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {result.risk_score?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{result.decision || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Details */}
                    {expandedRow === idx && (
                      <tr className="bg-blue-50 border-b border-gray-200">
                        <td colSpan="6" className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(result).map(([key, value]) => (
                              key !== 'applicant_id' && key !== 'applicant_name' && key !== 'risk_level' && key !== 'risk_score' && key !== 'decision' && (
                                <div key={key}>
                                  <p className="text-xs font-medium text-gray-600 capitalize">{key.replace(/_/g, ' ')}</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {typeof value === 'number' ? value.toFixed(2) : String(value)}
                                  </p>
                                </div>
                              )
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No results found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, filteredResults.length)} of {filteredResults.length} results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BatchResults;
