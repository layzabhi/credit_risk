import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, Users, CheckCircle2, AlertTriangle,
  Loader2, Search, PlusCircle, ArrowUpDown,
  X, Sparkles, Activity, Cpu, Clock, ShieldCheck, Database
} from 'lucide-react';

// Preset templates for sandbox scoring
const PRESET_TEMPLATES = [
  {
    name: 'Prime Client (Low Risk)',
    description: 'High income, excellent credit history, and minimal debt.',
    data: {
      applicant_id: '', // Will be generated dynamically
      age: 42,
      gender: 'Female',
      education_level: 'PhD',
      marital_status: 'Married',
      income: 145000,
      credit_score: 810,
      loan_amount: 35000,
      loan_purpose: 'Home',
      employment_status: 'Employed',
      years_at_current_job: 10,
      payment_history: 'Good',
      debt_to_income_ratio: 0.09,
      assets_value: 620000,
      number_of_dependents: 1,
      previous_defaults: 0
    }
  },
  {
    name: 'Subprime Client (Medium Risk)',
    description: 'Average income and fair credit score, with some active debt.',
    data: {
      applicant_id: '',
      age: 30,
      gender: 'Male',
      education_level: 'Bachelor',
      marital_status: 'Single',
      income: 65000,
      credit_score: 670,
      loan_amount: 22000,
      loan_purpose: 'Personal',
      employment_status: 'Employed',
      years_at_current_job: 4,
      payment_history: 'Fair',
      debt_to_income_ratio: 0.31,
      assets_value: 40000,
      number_of_dependents: 0,
      previous_defaults: 0
    }
  },
  {
    name: 'High Risk Client (Default Risk)',
    description: 'Low income, poor credit score, high DTI, and past defaults.',
    data: {
      applicant_id: '',
      age: 24,
      gender: 'Male',
      education_level: 'High School',
      marital_status: 'Single',
      income: 26000,
      credit_score: 530,
      loan_amount: 14000,
      loan_purpose: 'Personal',
      employment_status: 'Unemployed',
      years_at_current_job: 0,
      payment_history: 'Poor',
      debt_to_income_ratio: 0.52,
      assets_value: 4000,
      number_of_dependents: 2,
      previous_defaults: 2
    }
  }
];

export function DashboardPage() {
  const { get, post } = useApi();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [riskDistribution, setRiskDistribution] = useState([]);
  const [recentScores, setRecentScores] = useState([]);
  const [scoringTrend, setScoringTrend] = useState([]);
  const [error, setError] = useState(null);

  // Table sorting, searching, and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Trend chart type toggle
  const [activeChart, setActiveChart] = useState('area'); // 'bar', 'line', 'area'

  // Auto-refresh states
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30); // 0 (off), 10, 30, 60
  const [countdown, setCountdown] = useState(30);
  const timerRef = useRef(null);

  // Inspector & Modal states
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [quickScorerOpen, setQuickScorerOpen] = useState(false);
  const [seedingLoading, setSeedingLoading] = useState(false);

  // Quick Scorer Form details
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [quickScorerData, setQuickScorerData] = useState(null);
  const [quickScorerLoading, setQuickScorerLoading] = useState(false);
  const [quickScorerResult, setQuickScorerResult] = useState(null);
  const [quickScorerError, setQuickScorerError] = useState(null);

  // Load dashboard data from backend
  const loadDashboard = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const [statsData, riskData, scoresData, trendData] = await Promise.all([
        get('/v1/dashboard/stats'),
        get('/v1/dashboard/risk-distribution'),
        get('/v1/dashboard/recent-scores'),
        get('/v1/dashboard/scoring-trend')
      ]);

      setStats(statsData);
      setRiskDistribution(riskData);
      setRecentScores(scoresData);
      setScoringTrend(trendData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to fetch dashboard metrics. Verify database and API server connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [get]);

  // Seeding sandbox data helper
  const handleSeedData = async () => {
    setSeedingLoading(true);
    setError(null);
    try {
      await post('/v1/dashboard/seed');
      await loadDashboard(true);
    } catch (err) {
      console.error('Failed to seed dashboard:', err);
      setError(err.message || 'Failed to seed sample assessment data.');
    } finally {
      setSeedingLoading(false);
    }
  };

  // Timer loop for auto-refresh countdown
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (autoRefreshInterval > 0) {
      setCountdown(autoRefreshInterval);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            loadDashboard(true);
            return autoRefreshInterval;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoRefreshInterval, loadDashboard]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Initialize Quick Scorer Form with Template Data
  useEffect(() => {
    if (quickScorerOpen) {
      const template = PRESET_TEMPLATES[selectedTemplate];
      setQuickScorerData({
        ...template.data,
        applicant_id: `APP-SEED-${Date.now().toString().slice(-4)}`
      });
      setQuickScorerResult(null);
      setQuickScorerError(null);
    }
  }, [quickScorerOpen, selectedTemplate]);

  // Handle Quick Scorer Submission
  const handleQuickScoreSubmit = async (e) => {
    e.preventDefault();
    setQuickScorerLoading(true);
    setQuickScorerError(null);
    setQuickScorerResult(null);

    try {
      const result = await post('/v1/score', quickScorerData);
      setQuickScorerResult(result);
      loadDashboard(true);
    } catch (err) {
      console.error('Quick assessment failed:', err);
      setQuickScorerError(err.message || 'Scoring request validation failed.');
    } finally {
      setQuickScorerLoading(false);
    }
  };

  const CHART_COLORS = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  };
  const PIE_COLORS = [CHART_COLORS.low, CHART_COLORS.medium, CHART_COLORS.high];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const processedRecentScores = React.useMemo(() => {
    let result = [...recentScores];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(score =>
        score.applicant_id.toLowerCase().includes(query)
      );
    }

    if (selectedRiskFilter !== 'all') {
      result = result.filter(score =>
        score.risk_level.toLowerCase() === selectedRiskFilter.toLowerCase()
      );
    }

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'risk_score') {
        aVal = a.risk_score || 0;
        bVal = b.risk_score || 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [recentScores, searchQuery, selectedRiskFilter, sortField, sortOrder]);

  const hasData = stats && stats.total_scored > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading Risk Analysis Platform...</p>
      </div>
    );
  }

  // Get count by risk rating helper
  const getRiskCount = (rating) => {
    const item = riskDistribution.find(d => d.name.toLowerCase().includes(rating.toLowerCase()));
    return item ? item.value : 0;
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-800">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-800">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Database Warning</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content Areas */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-slate-100 bg-white shadow-sm max-w-2xl mx-auto my-12 relative overflow-hidden">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-200 relative">
            <Database className="w-8 h-8 text-indigo-600" />
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-3">Initialize Sandbox Data</h2>
          <p className="text-slate-500 text-xs max-w-md mx-auto mb-8 leading-relaxed">
            The assessment database is currently empty. Seed sandbox data containing credit applicant demographics, risk metrics, and model SHAP explanation logs to unlock the dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <button
              onClick={handleSeedData}
              disabled={seedingLoading}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              {seedingLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Database className="w-4 h-4 text-white" />
              )}
              {seedingLoading ? 'Generating Sandbox Data...' : 'Seed Sample Assessment Data'}
            </button>

            <button
              onClick={() => setQuickScorerOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              Perform Quick Scoring
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Analytics Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-purpose="metrics-overview">
            {/* Total Scored */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-sm font-semibold text-slate-600 mb-6">Total Scored</p>
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className="text-2xl font-bold text-slate-800 font-mono">{stats?.total_scored || 0}</h3>
                <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                  +{stats?.daily_increase || 0} Today
                </span>
              </div>
              <p className="text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  Active risk profiles records
                </span>
              </p>
            </div>

            {/* Low Risk */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-sm font-semibold text-slate-600 mb-6">LOW RISK (APPROVED)</p>
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className="text-2xl font-bold text-slate-800 font-mono">{stats?.low_risk_count || 0}</h3>
                <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                  {stats?.low_risk_percentage || 0}%
                </span>
              </div>
              <p className="text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Healthy credit portfolio ratio
                </span>
              </p>
            </div>

            {/* Medium Risk */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-sm font-semibold text-slate-600 mb-6">MEDIUM RISK (REVIEW)</p>
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className="text-2xl font-bold text-slate-800 font-mono">{stats?.medium_risk_count || 0}</h3>
                <span className="flex items-center text-amber-500 text-xs font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                  {stats?.medium_risk_percentage || 0}%
                </span>
              </div>
              <p className="text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Requires secondary review
                </span>
              </p>
            </div>

            {/* High Risk */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-sm font-semibold text-slate-600 mb-6">HIGH RISK (DECLINED)</p>
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className="text-2xl font-bold text-slate-800 font-mono">{stats?.high_risk_count || 0}</h3>
                <span className="flex items-center text-red-500 text-xs font-bold bg-red-50 px-1.5 py-0.5 rounded">
                  {stats?.high_risk_percentage || 0}%
                </span>
              </div>
              <p className="text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  Triggered automatic denials
                </span>
              </p>
            </div>
          </section>

          {/* Interactive Chart Section */}
          <section className="p-8 rounded-2xl border border-slate-100 shadow-sm bg-white" data-purpose="analysis-chart-container">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Portfolio Risk Share */}
              <div className="lg:col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-800">Portfolio Risk Share</h3>
                </div>
                <p className="text-xs text-slate-400 mb-8">Relative distribution of credit risk ratings.</p>
                
                <div className="relative flex items-center justify-center h-56 my-4">
                  {riskDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {riskDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            borderColor: '#e2e8f0',
                            borderRadius: '12px',
                            color: '#1e293b',
                            fontSize: '11px',
                            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-slate-400 text-xs">No logs available</p>
                  )}
                  {/* Center Label */}
                  <div className="absolute text-center">
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest leading-none">Model</p>
                    <p className="text-indigo-600 font-extrabold text-sm mt-1.5 font-mono">XGBoost</p>
                  </div>
                </div>

                {/* Risk Count Footer Grid */}
                <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Low</p>
                    <p className="text-sm font-bold text-emerald-500 font-mono">{getRiskCount('low')}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Medium</p>
                    <p className="text-sm font-bold text-amber-500 font-mono">{getRiskCount('medium')}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">High</p>
                    <p className="text-sm font-bold text-red-500 font-mono">{getRiskCount('high')}</p>
                  </div>
                </div>
              </div>

              {/* Credit Assessment Trends */}
              <div className="lg:col-span-2">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      <h3 className="text-lg font-bold text-slate-800">Credit Assessment Trends</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Assessment volume patterns over the last 7 days.</p>
                  </div>

                  {/* Chart Type Toggles */}
                  <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                    {['bar', 'line', 'area'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setActiveChart(type)}
                        className={`px-3 py-1 text-[10px] font-semibold rounded ${
                          activeChart === type 
                            ? 'text-indigo-600 bg-white shadow-sm font-bold' 
                            : 'text-slate-650 hover:text-slate-900 transition-colors'
                        }`}
                      >
                        <span className="capitalize">{type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trend Chart */}
                <div className="h-56 w-full mt-8">
                  {scoringTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {activeChart === 'bar' ? (
                        <BarChart data={scoringTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} />
                          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                          <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b' }}
                          />
                          <Bar dataKey="low_risk" fill={CHART_COLORS.low} name="Low Risk" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="medium_risk" fill={CHART_COLORS.medium} name="Medium Risk" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="high_risk" fill={CHART_COLORS.high} name="High Risk" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      ) : activeChart === 'line' ? (
                        <LineChart data={scoringTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} />
                          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                          <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b' }}
                          />
                          <Line type="monotone" dataKey="low_risk" stroke={CHART_COLORS.low} strokeWidth={2.5} name="Low Risk" dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="medium_risk" stroke={CHART_COLORS.medium} strokeWidth={2.5} name="Medium Risk" dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="high_risk" stroke={CHART_COLORS.high} strokeWidth={2.5} name="High Risk" dot={{ r: 3 }} />
                        </LineChart>
                      ) : (
                        <AreaChart data={scoringTrend}>
                          <defs>
                            <linearGradient id="colorLowLight" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.low} stopOpacity={0.15} />
                              <stop offset="95%" stopColor={CHART_COLORS.low} stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="colorMedLight" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.medium} stopOpacity={0.15} />
                              <stop offset="95%" stopColor={CHART_COLORS.medium} stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="colorHighLight" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.high} stopOpacity={0.15} />
                              <stop offset="95%" stopColor={CHART_COLORS.high} stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} />
                          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                          <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b' }}
                          />
                          <Area type="monotone" dataKey="low_risk" stroke={CHART_COLORS.low} strokeWidth={2.5} fillOpacity={1} fill="url(#colorLowLight)" name="Low Risk" />
                          <Area type="monotone" dataKey="medium_risk" stroke={CHART_COLORS.medium} strokeWidth={2.5} fillOpacity={1} fill="url(#colorMedLight)" name="Medium Risk" />
                          <Area type="monotone" dataKey="high_risk" stroke={CHART_COLORS.high} strokeWidth={2.5} fillOpacity={1} fill="url(#colorHighLight)" name="High Risk" />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-slate-400 text-xs">No trends available</p>
                  )}
                </div>

                {/* Legends */}
                <div className="flex items-center justify-center gap-6 mt-8">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-medium text-slate-500">Low Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-[10px] font-medium text-slate-500">Medium Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span className="text-[10px] font-medium text-slate-500">High Risk</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Risk Assessments */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8" data-purpose="recent-risk-assessments">
            <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Cpu className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-800">Recent Risk Assessments</h3>
                </div>
                <p className="text-xs text-slate-400">Inspect SHAP explainability models and full audit trails by clicking any record.</p>
              </div>

              {/* Table Filters, Search, and Action */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Applicant ID..."
                    className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                {/* Filter tabs */}
                <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                  {['all', 'low', 'medium', 'high'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setSelectedRiskFilter(filter)}
                      className={`px-3 py-1 rounded capitalize transition-all ${
                        selectedRiskFilter === filter 
                          ? 'text-indigo-600 bg-white shadow-sm font-bold' 
                          : 'text-slate-600 hover:text-indigo-600'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* Run Assessment Quick Scorer Button */}
                <button
                  onClick={() => setQuickScorerOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-white" />
                  Assess Risk
                </button>
              </div>
            </div>

            {/* Assessment Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th
                      onClick={() => handleSort('applicant_id')}
                      className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        APPLICANT ID <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('risk_level')}
                      className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        RISK RATING <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('risk_score')}
                      className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        PROBABILITY OF DEFAULT <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('created_at')}
                      className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        ASSESSMENT DATE <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedRecentScores.length > 0 ? (
                    processedRecentScores.map((score, idx) => (
                      <tr
                        key={idx}
                        onClick={() => setSelectedAssessment(score)}
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors font-mono">
                          {score.applicant_id}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                              score.risk_level === 'low'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : score.risk_level === 'medium'
                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                : 'bg-red-50 text-red-600 border-red-100'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              score.risk_level === 'low'
                                ? 'bg-emerald-500'
                                : score.risk_level === 'medium'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}></span>
                            {score.risk_level}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-650 font-mono">
                          {(score.risk_score * 100).toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(score.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-12 text-slate-400 text-xs">
                        No credit evaluations found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Slide-out Panel: Explainability & Audit Inspector */}
      {selectedAssessment && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-end transition-opacity animate-fadeIn">
          {/* Close click area */}
          <div className="absolute inset-0" onClick={() => setSelectedAssessment(null)}></div>

          <div className="relative w-full max-w-xl h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col p-8 overflow-y-auto custom-scrollbar animate-slideIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider font-mono">Assessment Profile</p>
                <h3 className="text-xl font-bold text-slate-800 font-mono mt-1">{selectedAssessment.applicant_id}</h3>
              </div>
              <button
                onClick={() => setSelectedAssessment(null)}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition-all focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Risk Level</p>
                <span
                  className={`inline-block mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase border ${
                    selectedAssessment.risk_level === 'low'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : selectedAssessment.risk_level === 'medium'
                      ? 'bg-amber-50 text-amber-600 border-amber-100'
                      : 'bg-red-50 text-red-600 border-red-100'
                  }`}
                >
                  {selectedAssessment.risk_level}
                </span>
              </div>
              <div className="text-center border-x border-slate-200">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Default Risk</p>
                <p className="text-base font-extrabold text-slate-800 font-mono mt-1.5">
                  {(selectedAssessment.risk_score * 100).toFixed(2)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Model Config</p>
                <p className="text-xs font-bold text-slate-500 font-mono mt-2.5">xgboost_v2.0</p>
              </div>
            </div>

            {/* SHAP explainability attributes */}
            <div className="mb-8">
              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                SHAP Explainability Indicators
              </h4>

              {selectedAssessment.explanations?.top_features ? (
                <div className="space-y-4 bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  {selectedAssessment.explanations.top_features.map((feature, idx) => {
                    const isPositive = feature.direction === 'positive';
                    return (
                      <div key={idx} className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-700 capitalize">{feature.name.replace(/_/g, ' ')}</span>
                          <span className={isPositive ? 'text-red-500 font-bold' : 'text-emerald-600 font-bold'}>
                            {isPositive ? '+' : ''}{(feature.impact * 100).toFixed(1)}% {isPositive ? 'increase' : 'decrease'}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden p-[0.5px]">
                          <div
                            className={`h-full rounded-full ${isPositive ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{
                              width: `${Math.min(feature.impact * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-[10px] text-slate-400 italic mt-4">
                    Positive SHAP values push default risk probability higher, while negative ones suppress it.
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 text-xs bg-slate-50 rounded-2xl p-5 text-center border border-slate-100">
                  No SHAP explainability indicators exist for this sandbox record.
                </p>
              )}
            </div>

            {/* Audit log trail */}
            <div>
              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Compliance Audit Trail
              </h4>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-[10px] text-slate-600 overflow-x-auto max-h-56 custom-scrollbar">
                <pre>{JSON.stringify(selectedAssessment.audit_trail || selectedAssessment, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Drawer: Quick Score Calculator */}
      {quickScorerOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                <div>
                  <h3 className="text-base font-bold text-slate-850">RiskLens Sandbox Evaluator</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Mock single credit scoring and evaluate predictions live.</p>
                </div>
              </div>
              <button
                onClick={() => setQuickScorerOpen(false)}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition-all focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50/30">
              {/* Presets Column (Left) */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Select Profile Template</h4>
                {PRESET_TEMPLATES.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedTemplate(idx)}
                    className={`text-left p-4 rounded-2xl border transition-all ${
                      selectedTemplate === idx 
                        ? 'bg-white border-indigo-500 shadow-sm font-semibold' 
                        : 'bg-white border-slate-200 hover:border-slate-350 hover:scale-102'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{tpl.name}</span>
                      {selectedTemplate === idx && <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">{tpl.description}</p>
                  </button>
                ))}

                {/* Scorer result box */}
                {quickScorerResult && (
                  <div
                    className="mt-4 p-5 rounded-2xl border border-dashed text-center flex flex-col items-center justify-center gap-3 animate-fadeIn"
                    style={{
                      borderColor: quickScorerResult.risk_rating === 'low' ? 'rgba(16, 185, 129, 0.4)' : quickScorerResult.risk_rating === 'medium' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)',
                      backgroundColor: quickScorerResult.risk_rating === 'low' ? 'rgba(16, 185, 129, 0.05)' : quickScorerResult.risk_rating === 'medium' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(239, 68, 68, 0.05)'
                    }}
                  >
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Assessment Outcome</p>
                    <span
                      className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase font-mono tracking-wider border bg-white shadow-sm"
                      style={{
                        borderColor: quickScorerResult.risk_rating === 'low' ? 'rgba(16, 185, 129, 0.2)' : quickScorerResult.risk_rating === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: quickScorerResult.risk_rating === 'low' ? CHART_COLORS.low : quickScorerResult.risk_rating === 'medium' ? CHART_COLORS.medium : CHART_COLORS.high
                      }}
                    >
                      {quickScorerResult.risk_rating} Risk
                    </span>
                    <div>
                      <p className="text-2xl font-extrabold text-slate-800 font-mono">
                        {(quickScorerResult.default_probability * 100).toFixed(2)}%
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Probability of Default</p>
                    </div>
                  </div>
                )}

                {quickScorerError && (
                  <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex gap-2">
                    <AlertTriangle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                    <p>{quickScorerError}</p>
                  </div>
                )}
              </div>

              {/* Form Input Columns (Middle & Right) */}
              {quickScorerData && (
                <form onSubmit={handleQuickScoreSubmit} className="lg:col-span-2 flex flex-col gap-5 border-t lg:border-t-0 lg:border-l border-slate-200 lg:pl-6 pt-5 lg:pt-0">
                  <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Applicant Parameters</h4>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Applicant ID */}
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Applicant ID</label>
                      <input
                        type="text"
                        value={quickScorerData.applicant_id}
                        onChange={(e) => setQuickScorerData({ ...quickScorerData, applicant_id: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                        required
                      />
                    </div>

                    {/* Age */}
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Age</label>
                      <input
                        type="number"
                        value={quickScorerData.age}
                        onChange={(e) => setQuickScorerData({ ...quickScorerData, age: parseInt(e.target.value) || 18 })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                        min={18}
                        max={100}
                        required
                      />
                    </div>

                    {/* Credit Score */}
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">FICO Credit Score (300-850)</label>
                      <input
                        type="number"
                        value={quickScorerData.credit_score}
                        onChange={(e) => setQuickScorerData({ ...quickScorerData, credit_score: parseInt(e.target.value) || 300 })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                        min={300}
                        max={850}
                        required
                      />
                    </div>

                    {/* Income */}
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Annual Income ($)</label>
                      <input
                        type="number"
                        value={quickScorerData.income}
                        onChange={(e) => setQuickScorerData({ ...quickScorerData, income: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                        min={0}
                        required
                      />
                    </div>

                    {/* Loan Amount */}
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Loan Amount Requested ($)</label>
                      <input
                        type="number"
                        value={quickScorerData.loan_amount}
                        onChange={(e) => setQuickScorerData({ ...quickScorerData, loan_amount: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                        min={0}
                        required
                      />
                    </div>

                    {/* Debt-to-income Ratio */}
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Debt-to-Income (DTI) Ratio</label>
                      <input
                        type="number"
                        value={quickScorerData.debt_to_income_ratio}
                        onChange={(e) => setQuickScorerData({ ...quickScorerData, debt_to_income_ratio: parseFloat(e.target.value) || 0.0 })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                        min={0.0}
                        max={1.0}
                        step={0.01}
                        required
                      />
                    </div>

                    {/* Previous Defaults */}
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Previous Defaults</label>
                      <input
                        type="number"
                        value={quickScorerData.previous_defaults}
                        onChange={(e) => setQuickScorerData({ ...quickScorerData, previous_defaults: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                        min={0}
                        required
                      />
                    </div>

                    {/* Employment Status */}
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Employment Status</label>
                      <select
                        value={quickScorerData.employment_status}
                        onChange={(e) => setQuickScorerData({ ...quickScorerData, employment_status: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="Employed">Employed</option>
                        <option value="Self-employed">Self-employed</option>
                        <option value="Unemployed">Unemployed</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={quickScorerLoading}
                    className="w-full py-3 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {quickScorerLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-white" />
                    )}
                    {quickScorerLoading ? 'Predicting Live Risk...' : 'Run Risk Prediction'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
