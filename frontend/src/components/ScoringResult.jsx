import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, TrendingUp, BarChart3, Zap } from 'lucide-react';

/**
 * ScoringResult Component
 * Displays credit scoring results with risk assessment and visualizations
 */
export function ScoringResult({ result, loading = false }) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-20 bg-gray-200 rounded-lg"></div>
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const getRiskColor = (risk) => {
    const riskLower = risk?.toLowerCase();
    if (riskLower === 'low') return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-100' };
    if (riskLower === 'medium') return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-100' };
    if (riskLower === 'high') return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-100' };
    return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', badge: 'bg-gray-100' };
  };

  const getRiskIcon = (risk) => {
    const riskLower = risk?.toLowerCase();
    if (riskLower === 'low') return <CheckCircle className="w-6 h-6 text-green-600" />;
    if (riskLower === 'high') return <AlertTriangle className="w-6 h-6 text-red-600" />;
    return <AlertCircle className="w-6 h-6 text-yellow-600" />;
  };

  const colors = getRiskColor(result.risk_level);

  return (
    <div className="space-y-6">
      {/* Main Result Card */}
      <div className={`rounded-lg border-2 ${colors.border} ${colors.bg} p-6`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Credit Risk Assessment</h3>
            <div className="flex items-center gap-3">
              {getRiskIcon(result.risk_level)}
              <span className={`text-3xl font-bold ${colors.text}`}>
                {result.risk_level?.toUpperCase()}
              </span>
            </div>
          </div>
          <span className={`${colors.badge} ${colors.text} px-4 py-2 rounded-lg font-semibold text-sm`}>
            Score: {result.risk_score?.toFixed(2)}
          </span>
        </div>

        {result.recommendation && (
          <p className={`text-sm ${colors.text}`}>
            <strong>Recommendation:</strong> {result.recommendation}
          </p>
        )}
      </div>

      {/* Key Metrics Grid */}
      {result.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(result.metrics).map(([key, value]) => (
            <div key={key} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-600 mb-1 capitalize">
                {key.replace(/_/g, ' ')}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {typeof value === 'number' ? value.toFixed(2) : value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Feature Importance / SHAP */}
      {result.feature_importance && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Top Contributing Factors</h4>
          </div>
          <div className="space-y-3">
            {result.feature_importance.slice(0, 5).map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {item.feature?.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {(item.importance * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
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
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Decision Breakdown</h4>
          </div>
          <div className="space-y-4">
            {Object.entries(result.decision_breakdown).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-gray-900">
                  {typeof value === 'boolean' ? (value ? '✓' : '✗') : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-600 space-y-1">
        {result.assessment_id && <p>Assessment ID: {result.assessment_id}</p>}
        {result.timestamp && <p>Timestamp: {new Date(result.timestamp).toLocaleString()}</p>}
        {result.model_version && <p>Model Version: {result.model_version}</p>}
      </div>
    </div>
  );
}

export default ScoringResult;
