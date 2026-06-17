import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Zap, Info } from 'lucide-react';

export function ExplainabilityPanel({ result, loading = false }) {
  const [activeTab, setActiveTab] = useState('force');
  const [hoveredFeature, setHoveredFeature] = useState(null);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-64 bg-gray-200 rounded-2xl neo-inset"></div>
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
      <div className="flex gap-2 p-1 rounded-2xl neo-inset bg-[#e8eaf0] w-fit">
        <button
          onClick={() => setActiveTab('force')}
          className={`px-4 py-2 font-bold text-xs rounded-xl transition-all ${
            activeTab === 'force'
              ? 'neo-raised text-primary bg-[#e8eaf0]'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Force Plot
        </button>
        <button
          onClick={() => setActiveTab('importance')}
          className={`px-4 py-2 font-bold text-xs rounded-xl transition-all ${
            activeTab === 'importance'
              ? 'neo-raised text-primary bg-[#e8eaf0]'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Feature Importance
        </button>
        <button
          onClick={() => setActiveTab('waterfall')}
          className={`px-4 py-2 font-bold text-xs rounded-xl transition-all ${
            activeTab === 'waterfall'
              ? 'neo-raised text-primary bg-[#e8eaf0]'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Waterfall
        </button>
      </div>

      {/* Force Plot Tab */}
      {activeTab === 'force' && (
        <div className="p-6 rounded-2xl bg-background neo-raised space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm text-on-surface">Force Plot - How Features Push predictions</h3>
          </div>

          {forcePlotData.length > 0 ? (
            <div className="space-y-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forcePlotData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#8a8c9a" opacity={0.15} />
                    <XAxis type="number" stroke="#8a8c9a" tick={{ fontSize: 9 }} />
                    <YAxis dataKey="feature" type="category" stroke="#8a8c9a" width={100} tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#e8eaf0', borderColor: '#d0d2dc', borderRadius: '12px', color: '#2e3040' }} />
                    <Bar dataKey="impact" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 neo-inset">
                <div className="flex gap-2">
                  <Info className="w-4.5 h-4.5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-primary">Interpret force plot values</p>
                    <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                      Bars reflect how individual applicant parameters push risk probability. Positive impact signals default probability increases, while negative indicators represent risk mitigations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xs text-on-surface-variant">No force plot data available</p>
            </div>
          )}
        </div>
      )}

      {/* Feature Importance Tab */}
      {activeTab === 'importance' && (
        <div className="p-6 rounded-2xl bg-background neo-raised space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm text-on-surface">Feature Importance - Key Factors</h3>
          </div>

          {featureData.length > 0 ? (
            <div className="space-y-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={featureData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#8a8c9a" opacity={0.15} />
                    <XAxis dataKey="name" stroke="#8a8c9a" height={50} tick={{ fontSize: 9 }} />
                    <YAxis stroke="#8a8c9a" tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(value) => `${(value * 100).toFixed(2)}%`} contentStyle={{ backgroundColor: '#e8eaf0', borderColor: '#d0d2dc', borderRadius: '12px', color: '#2e3040' }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider pl-1">Detailed Contribution Breakdown</h4>
                {featureData.map((feature, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredFeature(idx)}
                    onMouseLeave={() => setHoveredFeature(null)}
                    className={`p-3 rounded-xl transition-all ${
                      hoveredFeature === idx ? 'neo-inset bg-indigo-50 border border-primary/20' : 'neo-raised bg-background'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5 text-xs">
                      <span className="font-bold text-on-surface capitalize">{feature.name}</span>
                      <span className="font-extrabold text-primary font-mono">
                        {(feature.value * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2 neo-inset p-[1px] overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${feature.value * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xs text-on-surface-variant">No feature importance data available</p>
            </div>
          )}
        </div>
      )}

      {/* Waterfall Tab */}
      {activeTab === 'waterfall' && (
        <div className="p-6 rounded-2xl bg-background neo-raised space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm text-on-surface">Waterfall - Cumulative Effects</h3>
          </div>

          {shapValues.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={shapValues} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#8a8c9a" opacity={0.15} />
                  <XAxis dataKey="index" stroke="#8a8c9a" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#8a8c9a" tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#e8eaf0', borderColor: '#d0d2dc', borderRadius: '12px', color: '#2e3040' }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    dot={{ fill: '#7c3aed', r: 3 }}
                    activeDot={{ r: 5 }}
                    name="SHAP Value"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xs text-on-surface-variant">No waterfall data available</p>
            </div>
          )}

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 neo-inset">
            <div className="flex gap-2">
              <Info className="w-4.5 h-4.5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-primary">Interpret cumulative effects</p>
                <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                  Cumulative SHAP values display how each feature sequentially moves the prediction from the model's base expected value to the final computed risk probability.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-[10px] text-on-surface-variant font-medium space-y-1 font-mono pl-1 opacity-70">
        {result.explainer_version && <p>Explainer Version: {result.explainer_version}</p>}
        {result.expected_value !== undefined && <p>Base Value: {result.expected_value.toFixed(4)}</p>}
      </div>
    </div>
  );
}

export default ExplainabilityPanel;
