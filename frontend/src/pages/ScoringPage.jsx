import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ScoringForm from '../components/ScoringForm';
import ScoringResult from '../components/ScoringResult';
import ExplainabilityPanel from '../components/ExplainabilityPanel';
import { useApi } from '../hooks/useApi';
import {
  HelpCircle,
  Activity,
  ChevronRight,
  History,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Loader2
} from 'lucide-react';

export const normalizeScoreResult = (rawResult) => {
  if (!rawResult) return null;

  const risk_level = rawResult.risk_level || rawResult.risk_rating || 'low';
  const default_probability = rawResult.default_probability || 0.0;

  const metrics = rawResult.metrics || {
    fico_score: rawResult.credit_score || 720,
    annual_income: rawResult.income || 75000,
    dti_ratio: rawResult.debt_to_income_ratio || 0.35,
  };

  let feature_importance = [];
  if (rawResult.feature_importance) {
    feature_importance = rawResult.feature_importance;
  } else if (rawResult.explanations?.top_features) {
    feature_importance = rawResult.explanations.top_features.map(f => ({
      feature: f.name || f.feature,
      importance: f.impact || f.importance || 0,
      contribution: f.impact || 0
    }));
  }

  let force_plot_data = [];
  if (rawResult.force_plot_data) {
    force_plot_data = rawResult.force_plot_data;
  } else if (rawResult.explanations?.top_features) {
    force_plot_data = rawResult.explanations.top_features.map(f => ({
      feature: f.name || f.feature,
      impact: f.direction === 'negative' ? -(f.impact || 0) : (f.impact || 0)
    }));
  }

  let shap_values = [];
  if (Array.isArray(rawResult.shap_values)) {
    shap_values = rawResult.shap_values;
  } else if (rawResult.explanations?.shap_values) {
    shap_values = Object.values(rawResult.explanations.shap_values);
  } else if (rawResult.shap_values && typeof rawResult.shap_values === 'object') {
    shap_values = Object.values(rawResult.shap_values);
  }

  const decision_breakdown = rawResult.decision_breakdown || {
    credit_score_check: (rawResult.credit_score || metrics.fico_score) >= 600,
    dti_validation: (rawResult.debt_to_income_ratio || metrics.dti_ratio) <= 0.45,
    defaults_check: (rawResult.previous_defaults !== undefined ? rawResult.previous_defaults : 0) === 0
  };

  return {
    ...rawResult,
    risk_level,
    default_probability,
    metrics,
    feature_importance,
    force_plot_data,
    shap_values,
    decision_breakdown,
    recommendation: rawResult.recommendation || (risk_level.toLowerCase() === 'low' ? 'APPROVED' : risk_level.toLowerCase() === 'medium' ? 'REFER FOR MANUAL REVIEW' : 'DECLINED')
  };
};

export function ScoringPage() {
  const navigate = useNavigate();
  const { get } = useApi();
  const [scoreResult, setScoreResult] = useState(null);
  const [showExplanations, setShowExplanations] = useState(false);
  const [recentRuns, setRecentRuns] = useState([]);
  const [recentRunsLoading, setRecentRunsLoading] = useState(false);

  const fetchRecentRuns = useCallback(async (silent = false) => {
    try {
      if (!silent) setRecentRunsLoading(true);
      const data = await get('/v1/dashboard/recent-scores');
      setRecentRuns(data || []);
    } catch (err) {
      console.error('Failed to fetch recent runs:', err);
    } finally {
      setRecentRunsLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchRecentRuns();
  }, [fetchRecentRuns]);

  const handleScoreComplete = (result) => {
    setScoreResult(result);
    setShowExplanations(true);
    fetchRecentRuns(true);
  };

  const handleRecentRunClick = (run) => {
    setScoreResult(run);
    setShowExplanations(true);
  };

  const handleViewFullHistory = () => {
    navigate('/dashboard');
  };

  const normalizedResult = normalizeScoreResult(scoreResult);

  // needle angle calculation based on default probability
  const defaultProbability = normalizedResult ? normalizedResult.default_probability : 0.5;
  const needleAngle = normalizedResult ? (1 - defaultProbability) * 180 - 90 : 0;

  const riskRatingLabel = normalizedResult ? normalizedResult.risk_level : null;
  const riskRatingLower = riskRatingLabel ? riskRatingLabel.toLowerCase() : null;

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Run Individual Prediction</h1>
        <p className="text-xs text-slate-500 mt-1">Enter applicant details below to generate a real-time risk assessment using the RiskLens Engine.</p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form and Explanations */}
        <div className="lg:col-span-8 space-y-6">
          {/* Application Details Card */}
          <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-slate-800">Application Details</h3>
              </div>
            </div>
            <div className="p-6">
              <ScoringForm onScoreComplete={handleScoreComplete} />
            </div>
          </div>

          {/* Visualization area / scoring explanation */}
          {normalizedResult ? (
            <div className="space-y-6 animate-fadeIn">
              <ScoringResult result={normalizedResult} />

              {showExplanations && (normalizedResult.feature_importance?.length > 0 || normalizedResult.shap_values?.length > 0) && (
                <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-6">
                  <h3 className="font-bold text-sm text-slate-800 mb-4 border-b border-slate-100 pb-3">Model Explanation</h3>
                  <ExplainabilityPanel result={normalizedResult} />
                </div>
              )}
            </div>
          ) : (
            /* Scoring Engine Info Card (replaces mockup IMAGE_6 placeholder) */
            <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                RiskLens Engine Architecture
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                The RiskLens scoring engine processes applicant metrics using a calibrated XGBoost ensemble classifier. The model operates in real-time, combining historical credit behavior, debt structures, and demographic variables to evaluate borrower default risks.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
                  <p className="text-3xs text-slate-400 font-bold uppercase">Accuracy</p>
                  <p className="text-base font-extrabold text-slate-700 font-mono mt-0.5">87.7%</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
                  <p className="text-3xs text-slate-400 font-bold uppercase">Model Type</p>
                  <p className="text-base font-extrabold text-slate-700 font-mono mt-0.5">XGBoost</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
                  <p className="text-3xs text-slate-400 font-bold uppercase">Features</p>
                  <p className="text-base font-extrabold text-slate-700 font-mono mt-0.5">23 Core</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
                  <p className="text-3xs text-slate-400 font-bold uppercase">Latency</p>
                  <p className="text-base font-extrabold text-slate-700 font-mono mt-0.5">~12ms</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Status Panel & Recent Runs */}
        <div className="lg:col-span-4 space-y-6">
          {/* Assessment Status Gauge Card */}
          <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-6 text-center flex flex-col items-center justify-between min-h-[420px] relative overflow-hidden">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 self-start">Assessment Status</h3>

            {/* Gauge */}
            <div className="w-full my-4 flex flex-col items-center">
              <div className="relative h-24 w-48 mx-auto overflow-hidden">
                {/* Gauge Background */}
                <div className="absolute top-0 left-0 w-full h-[200%] rounded-full border-[16px] border-slate-100"></div>
                {/* Gauge Segments */}
                <div className="absolute top-0 left-0 w-full h-[200%] rounded-full border-[16px] border-transparent border-l-red-500 border-t-red-500 rotate-[45deg]"></div>
                <div className="absolute top-0 left-0 w-full h-[200%] rounded-full border-[16px] border-transparent border-t-amber-400 rotate-[0deg]"></div>
                <div className="absolute top-0 left-0 w-full h-[200%] rounded-full border-[16px] border-transparent border-r-emerald-500 border-t-emerald-500 -rotate-[45deg]"></div>
                {/* Needle */}
                <div
                  className="absolute bottom-0 left-1/2 w-1 h-16 bg-slate-800 origin-bottom rounded-full transition-transform duration-[1200ms]"
                  style={{ transform: `translateX(-50%) rotate(${needleAngle}deg)` }}
                ></div>
                {/* Needle Cap */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-slate-800 rounded-full border border-white"></div>
              </div>
              {/* Gauge Labels */}
              <div className="flex justify-between w-48 mt-1.5 px-3">
                <span className="text-[10px] font-bold text-red-500 uppercase">Poor</span>
                <span className="text-[10px] font-bold text-amber-500 uppercase">Fair</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">Good</span>
              </div>
            </div>

            {/* Assessment State Content */}
            {!normalizedResult ? (
              <div className="space-y-4 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 border border-slate-150 rounded-full flex items-center justify-center mb-1 animate-pulse">
                  <HelpCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="font-bold text-sm text-slate-800">Awaiting Input</h4>
                <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed">
                  Please complete the application form on the left. Once all required fields are filled, click <span className="font-bold text-primary">Run Risk Analysis</span> to generate a credit risk score.
                </p>
                <div className="pt-2 w-full space-y-1.5 text-left text-2xs font-semibold text-slate-400">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span>Risk Score Calculation</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span>Default Probability Analysis</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span>Automated Decision Logic</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${riskRatingLower === 'low'
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                  : riskRatingLower === 'medium'
                    ? 'bg-amber-50 border-amber-100 text-amber-600'
                    : 'bg-red-50 border-red-100 text-red-600'
                  }`}>
                  {riskRatingLower === 'low' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : riskRatingLower === 'medium' ? (
                    <AlertCircle className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className={`font-extrabold text-base uppercase ${riskRatingLower === 'low'
                    ? 'text-emerald-600'
                    : riskRatingLower === 'medium'
                      ? 'text-amber-500'
                      : 'text-red-500'
                    }`}>
                    {riskRatingLabel} Risk
                  </h4>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">
                    Default Probability: {(normalizedResult.default_probability * 100).toFixed(2)}%
                  </p>
                </div>
                <p className="text-xs text-slate-505 max-w-[260px] leading-relaxed bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                  {normalizedResult.recommendation}
                </p>

                {/* Evaluated Bullet Metrics */}
                <div className="pt-2 w-full space-y-1.5 text-left text-2xs font-semibold text-slate-500">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-md">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${riskRatingLower === 'low' ? 'bg-emerald-500' : riskRatingLower === 'medium' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                      <span>Risk Rating</span>
                    </div>
                    <span className="font-mono font-bold uppercase">{riskRatingLabel}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-md">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${riskRatingLower === 'low' ? 'bg-emerald-500' : riskRatingLower === 'medium' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                      <span>Default Probability</span>
                    </div>
                    <span className="font-mono font-bold">{(normalizedResult.default_probability * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-md">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${riskRatingLower === 'low' ? 'bg-emerald-500' : riskRatingLower === 'medium' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                      <span>Decision Outcome</span>
                    </div>
                    <span className={`font-bold uppercase ${riskRatingLower === 'low'
                      ? 'text-emerald-600'
                      : riskRatingLower === 'medium'
                        ? 'text-amber-500'
                        : 'text-red-500'
                      }`}>
                      {riskRatingLower === 'low' ? 'Approved' : riskRatingLower === 'medium' ? 'Refer' : 'Declined'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Runs Mini-Widget */}
          <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-slate-50/50 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recent Runs</span>
              <button
                onClick={() => fetchRecentRuns(true)}
                disabled={recentRunsLoading}
                className="text-slate-400 hover:text-primary transition-colors disabled:opacity-40"
              >
                <History className={`w-4 h-4 ${recentRunsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {recentRunsLoading && recentRuns.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                Loading recent runs...
              </div>
            ) : recentRuns.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No recent evaluations found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[280px] overflow-y-auto custom-scrollbar">
                {recentRuns.map((run, idx) => {
                  const runRisk = run.risk_level || run.risk_rating || 'low';
                  const runRiskLower = runRisk.toLowerCase();
                  return (
                    <div
                      key={idx}
                      onClick={() => handleRecentRunClick(run)}
                      className={`px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer ${scoreResult?.applicant_id === run.applicant_id ? 'bg-indigo-50/40' : ''
                        }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-700 font-mono">{run.applicant_id}</p>
                        <p className="text-3xs text-slate-400 mt-0.5">
                          {new Date(run.created_at || run.timestamp || run.scoring_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-3xs font-extrabold uppercase border ${runRiskLower === 'low'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        : runRiskLower === 'medium'
                          ? 'bg-amber-50 border-amber-100 text-amber-600'
                          : 'bg-red-50 border-red-100 text-red-600'
                        }`}>
                        {runRiskLower === 'low' ? 'Approved' : runRiskLower === 'medium' ? 'Manual' : 'Rejected'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={handleViewFullHistory}
              className="w-full py-2.5 text-primary hover:bg-slate-50 border-t border-slate-100 text-3xs font-bold uppercase tracking-wider transition-all"
            >
              View Full History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScoringPage;
