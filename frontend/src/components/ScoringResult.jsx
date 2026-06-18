import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';

export function ScoringResult({ result, loading = false }) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-2xl neo-inset"></div>
        <div className="h-20 bg-gray-200 rounded-2xl neo-inset"></div>
        <div className="h-20 bg-gray-200 rounded-2xl neo-inset"></div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const CHART_COLORS = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  };

  const getRiskColor = (risk) => {
    const riskLower = risk?.toLowerCase();
    if (riskLower === 'low') return { bg: 'bg-green-500/5', border: 'border-green-500/20', text: 'text-green-600', badge: 'bg-green-100 text-green-700' };
    if (riskLower === 'medium') return { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' };
    if (riskLower === 'high') return { bg: 'bg-red-500/5', border: 'border-red-500/20', text: 'text-red-500', badge: 'bg-red-100 text-red-700' };
    return { bg: 'bg-gray-500/5', border: 'border-gray-500/20', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-750' };
  };

  const getRiskIcon = (risk) => {
    const riskLower = risk?.toLowerCase();
    if (riskLower === 'low') return <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />;
    if (riskLower === 'high') return <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />;
    return <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />;
  };

  const riskVal = result.risk_level || result.risk_rating;
  const colors = getRiskColor(riskVal);

  return (
    <div className="space-y-6">
      {/* Main Result Card */}
      <div className={`rounded-xl border ${colors.border} ${colors.bg} p-6 shadow-sm`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Credit Risk Rating</h3>
            <div className="flex items-center gap-2">
              {getRiskIcon(riskVal)}
              <span className={`text-xl font-bold uppercase ${colors.text}`}>
                {riskVal?.toUpperCase()} RISK
              </span>
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-full font-bold text-xs ${colors.badge} border border-slate-200/50`}>
            Prob: {(result.default_probability * 100).toFixed(2)}%
          </span>
        </div>

        {result.recommendation && (
          <p className="text-xs text-on-surface leading-relaxed mt-4 bg-white/50 p-3 rounded-lg border border-outline-variant/60">
            <span className="font-bold text-primary">Recommendation:</span> {result.recommendation}
          </p>
        )}
      </div>

      {/* Key Metrics Grid */}
      {result.metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(result.metrics).map(([key, value]) => (
            <div key={key} className="p-4 rounded-xl bg-white border border-outline-variant shadow-sm">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 capitalize">
                {key.replace(/_/g, ' ')}
              </p>
              <p className="text-lg font-bold text-on-surface font-mono">
                {typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Feature Importance / SHAP */}
      {result.feature_importance && (
        <div className="p-6 rounded-xl bg-white border border-outline-variant shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-sm text-on-surface">Top Contributing Factors</h4>
          </div>
          <div className="space-y-4">
            {result.feature_importance.slice(0, 5).map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-on-surface capitalize">
                    {item.feature?.replace(/_/g, ' ')}
                  </span>
                  <span className="text-primary font-bold font-mono">
                    {(item.importance * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${item.importance * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decision Breakdown */}
      {result.decision_breakdown && (
        <div className="p-6 rounded-xl bg-white border border-outline-variant shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-sm text-on-surface">Decision Breakdown</h4>
          </div>
          <div className="space-y-3">
            {Object.entries(result.decision_breakdown).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 text-xs">
                <span className="text-slate-500 font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                <span className={`font-bold font-mono ${typeof value === 'boolean' ? (value ? 'text-emerald-600' : 'text-red-600') : 'text-on-surface'}`}>
                  {typeof value === 'boolean' ? (value ? '✓ Passed' : '✗ Failed') : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-[10px] text-on-surface-variant font-medium space-y-1 font-mono pl-1 opacity-70">
        {result.assessment_id && <p>Assessment ID: {result.assessment_id}</p>}
        {result.timestamp && <p>Timestamp: {new Date(result.timestamp).toLocaleString()}</p>}
        {result.model_version && <p>Model Version: {result.model_version}</p>}
      </div>
    </div>
  );
}

export default ScoringResult;
