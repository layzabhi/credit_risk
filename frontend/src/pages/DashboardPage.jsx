import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, CheckCircle, AlertCircle, Loader } from 'lucide-react';

/**
 * DashboardPage - Main dashboard with key metrics and analytics
 */
export function DashboardPage() {
  const { get } = useApi();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [riskDistribution, setRiskDistribution] = useState([]);
  const [recentScores, setRecentScores] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard stats
      const statsData = await get('/v1/dashboard/stats');
      setStats(statsData);

      // Fetch risk distribution
      const riskData = await get('/v1/dashboard/risk-distribution');
      setRiskDistribution(riskData);

      // Fetch recent scores
      const scoresData = await get('/v1/dashboard/recent-scores');
      setRecentScores(scoresData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of credit risk assessments and key metrics</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Scored</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.total_scored || 0}</p>
            </div>
            <Users className="w-10 h-10 text-blue-100" />
          </div>
          <p className="text-xs text-gray-600 mt-3">
            {stats?.daily_increase || 0} new today
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Low Risk</p>
              <p className="text-3xl font-bold text-green-600">{stats?.low_risk_count || 0}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-100" />
          </div>
          <p className="text-xs text-gray-600 mt-3">
            {stats?.low_risk_percentage || 0}% of total
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Medium Risk</p>
              <p className="text-3xl font-bold text-yellow-600">{stats?.medium_risk_count || 0}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-yellow-100" />
          </div>
          <p className="text-xs text-gray-600 mt-3">
            {stats?.medium_risk_percentage || 0}% of total
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">High Risk</p>
              <p className="text-3xl font-bold text-red-600">{stats?.high_risk_count || 0}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-100" />
          </div>
          <p className="text-xs text-gray-600 mt-3">
            {stats?.high_risk_percentage || 0}% of total
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Pie Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          {riskDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-600">
              No data available
            </div>
          )}
        </div>

        {/* Scoring Trend */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Scoring Trend (Last 7 Days)</h3>
          {recentScores.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={recentScores}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="low_risk" fill="#10b981" name="Low Risk" />
                <Bar dataKey="medium_risk" fill="#f59e0b" name="Medium Risk" />
                <Bar dataKey="high_risk" fill="#ef4444" name="High Risk" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-600">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Recent Assessments */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Assessments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-4 py-2 font-medium text-gray-700">Applicant</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">Risk Level</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">Score</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentScores.slice(0, 5).map((assessment, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3">{assessment.applicant_id}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      assessment.risk_level === 'low'
                        ? 'bg-green-100 text-green-800'
                        : assessment.risk_level === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {assessment.risk_level}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{assessment.risk_score?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(assessment.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
