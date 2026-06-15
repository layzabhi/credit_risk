import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Zap, Info } from 'lucide-react';

/**
 * ExplainabilityPanel Component
 * Displays SHAP-based model explanations and feature contributions
 */
export function ExplainabilityPanel({ result, loading = false }) {
  const [activeTab, setActiveTab] = useState('force');
  const [hoveredFeature, setHoveredFeature] = useState(null);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-80 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  // Transform feature importance data for visualization
  const featureData = (result.feature_importance || []).map(f => ({
    name: f.feature?.replace(/_/g, ' '),
    value: f.importance,
    contribution: f.contribution || 0,
  }));

  const forcePlotData = (result.force_plot_data || []).slice(0, 10);
  const shapValues = (result.shap_values || []).map((v, i) => ({
    index: i,
    value: v,
  }));

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('force')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'force'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Force Plot
        </button>
        <button
          onClick={() => setActiveTab('importance')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'importance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Feature Importance
        </button>
        <button
          onClick={() => setActiveTab('waterfall')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'waterfall'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Waterfall
        </button>
      </div>

      {/* Force Plot Tab */}
      {activeTab === 'force' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Force Plot - How Features Push the Prediction</h3>
          </div>

          {forcePlotData.length > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={forcePlotData} layout="vertical" margin={{ top: 5, right: 30, left: 200, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="feature" type="category" width={200} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="impact" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">How to Read This Plot</p>
                    <p className="text-sm text-blue-800 mt-1">
                      Each bar shows how a feature contributes to the final prediction. Positive values push the prediction up (higher risk), negative values push it down (lower risk).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No force plot data available</p>
            </div>
          )}
        </div>
      )}

      {/* Feature Importance Tab */}
      {activeTab === 'importance' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Feature Importance - Most Influential Factors</h3>
          </div>

          {featureData.length > 0 ? (
            <div className="space-y-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={featureData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip formatter={(value) => `${(value * 100).toFixed(2)}%`} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Detailed Importance</h4>
                {featureData.map((feature, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredFeature(idx)}
                    onMouseLeave={() => setHoveredFeature(null)}
                    className={`p-3 rounded-lg transition-colors ${
                      hoveredFeature === idx ? 'bg-blue-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900 capitalize">{feature.name}</span>
                      <span className="text-sm font-semibold text-blue-600">
                        {(feature.value * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${feature.value * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No feature importance data available</p>
            </div>
          )}
        </div>
      )}

      {/* Waterfall Tab */}
      {activeTab === 'waterfall' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Waterfall - Cumulative Feature Effects</h3>
          </div>

          {shapValues.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={shapValues} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="SHAP Value"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No waterfall data available</p>
            </div>
          )}

          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">How to Read This Plot</p>
                <p className="text-sm text-gray-700 mt-1">
                  This waterfall plot shows how each feature cumulatively adds or subtracts from the base prediction to reach the final risk score.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-600 space-y-1">
        {result.explainer_version && <p>Explainer Version: {result.explainer_version}</p>}
        {result.expected_value !== undefined && <p>Base Value: {result.expected_value.toFixed(4)}</p>}
      </div>
    </div>
  );
}

export default ExplainabilityPanel;
