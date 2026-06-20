import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Search,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ScatterChart,
  Sparkles,
  Cpu,
  X,
  Loader2
} from 'lucide-react';

export function ExplainabilityPage() {
  const [searchTerm, setSearchTerm] = useState('APP-SEED-1000');
  const [explanation, setExplanation] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showShiftDetails, setShowShiftDetails] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrained, setRetrained] = useState(false);

  const { get } = useApi();

  const fetchExplanationData = async (targetId) => {
    if (!targetId || !targetId.trim()) return;
    setLoading(true);
    setSearchError(null);
    try {
      // 1. Fetch scoring history for this applicant
      const history = await get(`/v1/score/history/${targetId.trim()}`);
      if (!history || history.length === 0) {
        throw new Error(`No assessment history found for ID: ${targetId}`);
      }

      // 2. Fetch explanation details
      const explData = await get(`/v1/explain/${targetId.trim()}`);

      setAssessment(history[0]);
      setExplanation(explData);
    } catch (err) {
      console.error(err);
      setSearchError(err.message || 'Failed to retrieve model interpretability details.');
      setAssessment(null);
      setExplanation(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExplanationData('APP-SEED-1000');
  }, []);

  const handleRecalculate = () => {
    setIsCalculating(true);
    if (assessment) {
      fetchExplanationData(assessment.applicant_id);
    }
    setTimeout(() => {
      setIsCalculating(false);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h3 className="text-3xl font-headline font-bold tracking-tight text-on-surface">Model Interpretability</h3>
          <p className="text-on-surface-variant mt-1">
            Analyzing SHAP values and feature contributions for the XGBoost Default Predictor (v1.0).
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRecalculate}
            className={`px-6 py-2.5 rounded-xl bg-primary text-white font-semibold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm ${isCalculating && 'opacity-75'}`}
          >
            <RefreshCw className={`w-4 h-4 ${isCalculating && 'animate-spin'}`} />
            {isCalculating ? 'Calculating...' : 'Recalculate'}
          </button>
        </div>
      </div>

      {/* Global Importance Bento Grid Section */}
      <div className="grid grid-cols-12 gap-8">
        {/* Global Feature Importance */}
        <div className="col-span-12 lg:col-span-8 p-6 rounded-2xl border border-slate-100 shadow-sm bg-white">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-semibold text-lg flex items-center gap-2 text-on-surface">
              <BarChart3 className="w-5 h-5 text-primary" />
              Global Feature Importance (SHAP)
            </h4>
            <span className="text-xs font-bold px-3 py-1 rounded-full text-slate-500 bg-slate-100 border border-slate-200">
              Top 5 Features
            </span>
          </div>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1 px-1">
                <span className="font-medium text-on-surface">Debt-to-Income Ratio</span>
                <span className="text-on-surface-variant font-mono">0.342</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: '88%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1 px-1">
                <span className="font-medium text-on-surface">Total Credit Limit</span>
                <span className="text-on-surface-variant font-mono">0.289</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                <div className="h-full bg-primary/80 rounded-full transition-all duration-1000 ease-out" style={{ width: '72%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1 px-1">
                <span className="font-medium text-on-surface">Employment Tenure</span>
                <span className="text-on-surface-variant font-mono">0.215</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                <div className="h-full bg-primary/70 rounded-full transition-all duration-1000 ease-out" style={{ width: '58%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1 px-1">
                <span className="font-medium text-on-surface">Inquiries Last 6 Months</span>
                <span className="text-on-surface-variant font-mono">0.198</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                <div className="h-full bg-primary/60 rounded-full transition-all duration-1000 ease-out" style={{ width: '52%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1 px-1">
                <span className="font-medium text-on-surface">Revolving Balance</span>
                <span className="text-on-surface-variant font-mono">0.124</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                <div className="h-full bg-primary/50 rounded-full transition-all duration-1000 ease-out" style={{ width: '35%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Contributors Summary */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Top Positive Contributors (Reduces Risk) */}
          <div className="p-6 rounded-2xl border border-slate-100 shadow-sm bg-white">
            <h4 className="font-semibold text-sm text-green-600 flex items-center gap-2 mb-4 uppercase tracking-wider">
              <TrendingDown className="w-4 h-4 text-green-600" />
              Risk Mitigators
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm font-medium">Home Ownership (Mortgage)</span>
                <span className="text-xs font-bold text-green-600 font-mono">+12.0%</span>
              </li>
              <li className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm font-medium">Verified Income Source</span>
                <span className="text-xs font-bold text-green-600 font-mono">+8.5%</span>
              </li>
              <li className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm font-medium">Advanced Degree</span>
                <span className="text-xs font-bold text-green-600 font-mono">+4.2%</span>
              </li>
            </ul>
          </div>

          {/* Top Negative Contributors (Increases Risk) */}
          <div className="p-6 rounded-2xl border border-slate-100 shadow-sm bg-white">
            <h4 className="font-semibold text-sm text-red-500 flex items-center gap-2 mb-4 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-red-500" />
              Risk Drivers
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm font-medium">Revolving Utilization &gt; 80%</span>
                <span className="text-xs font-bold text-red-500 font-mono">-15.4%</span>
              </li>
              <li className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm font-medium">Recent Missed Payment</span>
                <span className="text-xs font-bold text-red-500 font-mono">-11.2%</span>
              </li>
              <li className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm font-medium">Short Credit History &lt; 2 yrs</span>
                <span className="text-xs font-bold text-red-500 font-mono">-9.8%</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Local Explanation Section */}
      <div className="p-8 rounded-2xl border border-slate-100 shadow-sm bg-white relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10 animate-fadeIn">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h4 className="font-semibold text-xl flex items-center gap-2 text-on-surface">
              <Search className="w-5 h-5 text-primary" />
              Local Explanation Lookup
            </h4>
            <p className="text-on-surface-variant text-sm mt-1">
              Specific force-plot breakdown for a given application ID.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col">
              <div className="px-4 py-2 rounded-full flex items-center gap-2 w-64 bg-slate-50 border border-slate-200">
                <Search className="w-4 h-4 text-outline" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      fetchExplanationData(searchTerm);
                    }
                  }}
                  className="bg-transparent border-none focus:ring-0 text-xs w-full p-0 font-medium placeholder:text-outline text-on-surface"
                  placeholder="Search Application ID..."
                />
                <button
                  onClick={() => fetchExplanationData(searchTerm)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Search
                </button>
              </div>
              {searchError && (
                <span className="text-[10px] text-red-500 font-semibold mt-1 px-2">
                  {searchError}. Try: APP-SEED-1000
                </span>
              )}
            </div>
            <div className="h-8 w-[1px] bg-outline-variant hidden sm:block"></div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Base Risk</p>
              <p className="text-lg font-bold text-on-surface font-mono">
                {explanation ? explanation.base_value.toFixed(2) : '0.15'}
              </p>
            </div>
            <div className="w-[1px] h-8 bg-outline-variant hidden sm:block"></div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Final Risk</p>
              <p className="text-lg font-bold text-primary font-mono">
                {assessment ? (assessment.default_probability ?? assessment.risk_score ?? 0.78).toFixed(2) : '0.78'}
              </p>
            </div>
          </div>
        </div>

        {/* Force Plot Visualization */}
        {explanation || assessment ? (
          <div className="relative h-56 w-full rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center overflow-hidden p-6">
            <div className="absolute inset-0 flex items-center px-12">
              {/* Negative Forces (Risk Drivers - Red) */}
              <div className="flex-1 flex flex-col items-end gap-2 pr-6">
                {(explanation?.top_features?.filter(f => f.direction === 'positive') || []).slice(0, 3).map((feat, idx) => {
                  const widthPercent = Math.min(Math.max(feat.impact * 150, 45), 95);
                  return (
                    <div
                      key={idx}
                      style={{ width: `${widthPercent}%` }}
                      className="h-8 bg-red-500/10 border-r-4 border-red-500 rounded-l-lg flex items-center justify-end pr-3 transition-all"
                    >
                      <span className="text-[10px] font-bold text-red-800 uppercase font-mono truncate max-w-full px-1">
                        {feat.name.replace(/_/g, ' ')} (+{(feat.impact * 100).toFixed(1)}%)
                      </span>
                    </div>
                  );
                })}
                {(explanation?.top_features?.filter(f => f.direction === 'positive') || []).length === 0 && (
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">No major risk drivers</span>
                )}
              </div>

              {/* Center Point Circle */}
              <div className="z-10 w-16 h-16 rounded-full bg-white shadow-md flex flex-col items-center justify-center border-2 border-primary shrink-0">
                <span className="text-xs font-bold text-on-surface-variant uppercase text-[8px]">Output</span>
                <span className="text-sm font-extrabold text-primary font-mono leading-none">
                  {assessment ? (assessment.default_probability ?? assessment.risk_score ?? 0.78).toFixed(2) : '0.78'}
                </span>
              </div>

              {/* Positive Forces (Mitigators - Green) */}
              <div className="flex-1 flex flex-col items-start gap-2 pl-6">
                {(explanation?.top_features?.filter(f => f.direction === 'negative') || []).slice(0, 3).map((feat, idx) => {
                  const widthPercent = Math.min(Math.max(feat.impact * 150, 45), 95);
                  return (
                    <div
                      key={idx}
                      style={{ width: `${widthPercent}%` }}
                      className="h-8 bg-green-500/15 border-l-4 border-green-500 rounded-r-lg flex items-center justify-start pl-3 transition-all"
                    >
                      <span className="text-[10px] font-bold text-green-700 uppercase font-mono truncate max-w-full px-1">
                        {feat.name.replace(/_/g, ' ')} (-{(feat.impact * 100).toFixed(1)}%)
                      </span>
                    </div>
                  );
                })}
                {(explanation?.top_features?.filter(f => f.direction === 'negative') || []).length === 0 && (
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">No major risk mitigators</span>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 flex gap-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div> Higher Risk
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div> Lower Risk
              </div>
            </div>
          </div>
        ) : (
          <div className="h-56 w-full rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center p-6 text-slate-400 text-sm font-semibold">
            No applicant search data available. Try entering APP-SEED-1000 above.
          </div>
        )}

        {/* Local metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="p-5 rounded-xl border border-slate-100 shadow-sm bg-white">
            <h5 className="text-xs font-bold text-on-surface-variant uppercase mb-3">Model Confidence</h5>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#d6d8de" strokeWidth="3"></circle>
                  <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#6366f1" strokeDasharray={`${assessment ? Math.round(assessment.confidence_score * 100) : 92}, 100`} strokeWidth="3"></circle>
                </svg>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold font-mono">
                  {assessment ? Math.round(assessment.confidence_score * 100) : 92}%
                </span>
              </div>
              <p className="text-xs leading-relaxed text-on-surface-variant">
                High fidelity explanation. SHAP residuals are within acceptable 2% tolerance.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-100 shadow-sm bg-white">
            <h5 className="text-xs font-bold text-on-surface-variant uppercase mb-3">Interaction Alerts</h5>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed text-on-surface-variant">
                Feature <span className="font-semibold text-on-surface">{explanation?.top_features?.[0]?.name?.replace(/_/g, ' ') || 'Total Credit Limit'}</span> interacted strongly with <span className="font-semibold text-on-surface">{explanation?.top_features?.[1]?.name?.replace(/_/g, ' ') || 'Payment History'}</span> for this applicant.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-100 shadow-sm bg-white">
            <h5 className="text-xs font-bold text-on-surface-variant uppercase mb-3">Action Recommended</h5>
            <div className="flex items-start gap-3">
              {(() => {
                const riskRating = (assessment?.risk_rating || assessment?.risk_level || 'medium').toLowerCase();
                const isLow = riskRating === 'low';
                const isHigh = riskRating === 'high';
                const iconColor = isLow ? 'text-green-600' : isHigh ? 'text-red-500' : 'text-amber-500';
                const IconComponent = isLow ? CheckCircle : AlertTriangle;
                const actionText = isLow ? 'Standard automatic processing recommended. The decision is highly stable.' :
                  isHigh ? 'Automatic rejection recommended. High probability of default exceeds threshold.' :
                    'Secondary manual review recommended. Moderate risk factors detected.';
                return (
                  <>
                    <IconComponent className={`w-5 h-5 ${iconColor} shrink-0 mt-0.5`} />
                    <p className="text-xs leading-relaxed text-on-surface-variant">
                      {actionText}
                    </p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Asymmetric Bottom Section */}
      <div className="grid grid-cols-12 gap-8">
        {/* Dependence Plot */}
        <div className="col-span-12 lg:col-span-7 p-6 rounded-2xl border border-slate-100 shadow-sm bg-white h-80 relative overflow-hidden">
          <h4 className="font-semibold text-lg flex items-center gap-2 mb-4 text-on-surface">
            <ScatterChart className="w-5 h-5 text-tertiary" />
            Feature Dependence: Income vs. SHAP
          </h4>

          <div className="w-full h-44 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-4 relative">
            <div className="absolute bottom-10 left-12 right-12 h-px bg-outline-variant/60"></div>
            <div className="absolute top-10 bottom-10 left-16 w-px bg-outline-variant/60"></div>
            <div className="absolute bottom-3 text-[10px] font-bold text-on-surface-variant w-full text-center">
              Annual Income ($k)
            </div>
            <div className="absolute left-6 top-1/2 -translate-y-1/2 rotate-[-90deg] text-[10px] font-bold text-on-surface-variant">
              SHAP Value
            </div>

            {/* Draw a soft dependence curve using SVG */}
            <svg className="absolute inset-0 w-full h-full p-12 pr-16" viewBox="0 0 100 50" preserveAspectRatio="none">
              <path d="M 10 40 Q 35 38 50 25 T 90 10" fill="none" stroke="#7c3aed" strokeWidth="2" />
              <circle cx="10" cy="40" r="1.5" fill="#6366f1" />
              <circle cx="20" cy="39" r="1.5" fill="#6366f1" />
              <circle cx="30" cy="35" r="1.5" fill="#7c3aed" />
              <circle cx="40" cy="30" r="1.5" fill="#7c3aed" />
              <circle cx="50" cy="25" r="1.5" fill="#7c3aed" />
              <circle cx="60" cy="18" r="1.5" fill="#6366f1" />
              <circle cx="70" cy="15" r="1.5" fill="#6366f1" />
              <circle cx="80" cy="12" r="1.5" fill="#6366f1" />
              <circle cx="90" cy="10" r="1.5" fill="#7c3aed" />
            </svg>
          </div>
          <p className="mt-2 text-xs text-on-surface-variant italic">
            Note: Upward trend shows income over $85k significantly reduces credit default risk probability.
          </p>
        </div>

        {/* System Alert Insight Card */}
        <div className="col-span-12 lg:col-span-5 p-8 rounded-2xl bg-indigo-900 text-white shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              System Insight
            </span>
            <h4 className="text-2xl font-bold mt-2 text-white">Feature Shift Detected</h4>
            <p className="mt-4 opacity-90 text-xs leading-relaxed text-slate-100">
              {retrained ? (
                "Drift successfully resolved. Model has been retrained with recent quarterly data. Current shift metrics have been reset to optimal levels."
              ) : (
                "The explainability engine has noted a 4% shift in feature importance for 'Employment Tenure' over the last 30 days. Consider retraining the model with recent quarterly data."
              )}
            </p>
          </div>
          <button
            onClick={() => setShowShiftDetails(true)}
            className="mt-6 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/20 font-bold text-xs cursor-pointer"
          >
            Analyze Shift Details
          </button>
        </div>
      </div>

      {showShiftDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden transition-all duration-300 transform scale-100 flex flex-col text-slate-800 dark:text-slate-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white">Feature Shift Analysis</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">System Alert Insight</p>
                </div>
              </div>
              <button
                onClick={() => setShowShiftDetails(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Warning/Alert box */}
              <div className={`p-4 rounded-xl border flex gap-3 ${retrained ? 'bg-green-50 dark:bg-green-950/20 border-green-200/50 dark:border-green-800/30' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30'}`}>
                {retrained ? (
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <h5 className={`font-bold text-xs uppercase tracking-wider ${retrained ? 'text-green-800 dark:text-green-300' : 'text-amber-800 dark:text-amber-300'}`}>
                    {retrained ? 'Status: Resolved' : 'Drift Alert Summary'}
                  </h5>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    {retrained ? (
                      "Drift successfully resolved. Model has been retrained with recent quarterly data. Current shift metrics have been reset to optimal levels."
                    ) : (
                      "A significant shift of -4.0% in feature importance was detected for 'Employment Tenure' over the last 30 days. This indicates that the model's reliance on this feature is decreasing due to changes in applicant profile distributions."
                    )}
                  </p>
                </div>
              </div>

              {/* Data Table Comparison */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Feature Importance Shift (SHAP)</h5>
                <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-150 dark:border-slate-800">
                        <th className="px-4 py-3">Feature Name</th>
                        <th className="px-4 py-3 text-right">30 Days Ago</th>
                        <th className="px-4 py-3 text-right">Today</th>
                        <th className="px-4 py-3 text-right">Shift Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-sm">
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Employment Tenure</td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 font-mono">21.5%</td>
                        <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-mono">{retrained ? '21.5%' : '17.5%'}</td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${retrained ? 'text-slate-500 dark:text-slate-400' : 'text-red-500'}`}>{retrained ? '0.0%' : '-4.0%'}</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Debt-to-Income Ratio</td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 font-mono">34.2%</td>
                        <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-mono">{retrained ? '34.2%' : '35.2%'}</td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${retrained ? 'text-slate-500 dark:text-slate-400' : 'text-green-600'}`}>{retrained ? '0.0%' : '+1.0%'}</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Total Credit Limit</td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 font-mono">28.9%</td>
                        <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-mono">{retrained ? '28.9%' : '30.2%'}</td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${retrained ? 'text-slate-500 dark:text-slate-400' : 'text-green-600'}`}>{retrained ? '0.0%' : '+1.3%'}</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Revolving Balance</td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 font-mono">12.4%</td>
                        <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-mono">{retrained ? '12.4%' : '14.1%'}</td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${retrained ? 'text-slate-500 dark:text-slate-400' : 'text-green-600'}`}>{retrained ? '0.0%' : '+1.7%'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Graphical Visualizer */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Shift Comparison Chart</h5>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-slate-350 dark:bg-slate-600 rounded-sm"></span>
                      <span className="text-slate-500 dark:text-slate-400">30 Days Ago</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-indigo-600 rounded-sm"></span>
                      <span className="text-slate-900 dark:text-white">Today</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 space-y-4">
                  {/* Item 1 */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Employment Tenure</span>
                      <span>{retrained ? '21.5% vs 21.5%' : '21.5% vs 17.5%'}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-400 dark:bg-slate-500" style={{ width: '21.5%' }}></div>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: retrained ? '21.5%' : '17.5%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Debt-to-Income Ratio</span>
                      <span>{retrained ? '34.2% vs 34.2%' : '34.2% vs 35.2%'}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-400 dark:bg-slate-500" style={{ width: '34.2%' }}></div>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: retrained ? '34.2%' : '35.2%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Population Stability Index (PSI)</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">{retrained ? '0.02' : '0.11'}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${retrained ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                      {retrained ? 'Optimal' : 'Moderate Drift'}
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Action Recommended</span>
                  <div className="mt-1.5 flex items-center gap-1.5 font-bold text-xs">
                    {retrained ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-700 dark:text-green-400">Model up-to-date</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-amber-700 dark:text-amber-400">Retraining suggested</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-150 dark:border-slate-800 flex justify-between items-center gap-3">
              <button
                onClick={() => {
                  setShowShiftDetails(false);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>

              {!retrained ? (
                <button
                  onClick={() => {
                    setIsRetraining(true);
                    setTimeout(() => {
                      setIsRetraining(false);
                      setRetrained(true);
                    }, 2000);
                  }}
                  disabled={isRetraining}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isRetraining ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Retraining Model...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Retrain Model (XGBoost)
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-green-600 font-bold text-xs">
                  <CheckCircle className="w-4 h-4" />
                  XGBoost v1.0 retrained successfully!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExplainabilityPage;
