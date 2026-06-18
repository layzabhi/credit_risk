import React, { useState } from 'react';
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
  Cpu
} from 'lucide-react';

export function ExplainabilityPage() {
  const [searchTerm, setSearchTerm] = useState('ID-8842-XJ');
  const [isCalculating, setIsCalculating] = useState(false);

  const handleRecalculate = () => {
    setIsCalculating(true);
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
            Analyzing SHAP values and feature contributions for the XGBoost Default Predictor (v4.2).
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2.5 rounded-xl neo-raised text-primary font-semibold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all bg-[#e8eaf0]">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={handleRecalculate}
            className={`px-6 py-2.5 rounded-xl neo-raised bg-primary text-white font-semibold flex items-center gap-2 hover:opacity-90 transition-all ${isCalculating && 'opacity-75'}`}
          >
            <RefreshCw className={`w-4 h-4 ${isCalculating && 'animate-spin'}`} />
            {isCalculating ? 'Calculating...' : 'Recalculate'}
          </button>
        </div>
      </div>

      {/* Global Importance Bento Grid Section */}
      <div className="grid grid-cols-12 gap-8">
        {/* Global Feature Importance */}
        <div className="col-span-12 lg:col-span-8 p-6 rounded-2xl neo-raised bg-background">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-semibold text-lg flex items-center gap-2 text-on-surface">
              <BarChart3 className="w-5 h-5 text-primary" />
              Global Feature Importance (SHAP)
            </h4>
            <span className="text-xs font-bold px-3 py-1 rounded-full neo-inset text-on-surface-variant bg-[#e8eaf0]">
              Top 5 Features
            </span>
          </div>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1 px-1">
                <span className="font-medium text-on-surface">Debt-to-Income Ratio</span>
                <span className="text-on-surface-variant font-mono">0.342</span>
              </div>
              <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden neo-inset p-[1px]">
                <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: '88%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1 px-1">
                <span className="font-medium text-on-surface">Total Credit Limit</span>
                <span className="text-on-surface-variant font-mono">0.289</span>
              </div>
              <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden neo-inset p-[1px]">
                <div className="h-full bg-primary/80 rounded-full transition-all duration-1000 ease-out" style={{ width: '72%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1 px-1">
                <span className="font-medium text-on-surface">Employment Tenure</span>
                <span className="text-on-surface-variant font-mono">0.215</span>
              </div>
              <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden neo-inset p-[1px]">
                <div className="h-full bg-primary/70 rounded-full transition-all duration-1000 ease-out" style={{ width: '58%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1 px-1">
                <span className="font-medium text-on-surface">Inquiries Last 6 Months</span>
                <span className="text-on-surface-variant font-mono">0.198</span>
              </div>
              <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden neo-inset p-[1px]">
                <div className="h-full bg-primary/60 rounded-full transition-all duration-1000 ease-out" style={{ width: '52%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1 px-1">
                <span className="font-medium text-on-surface">Revolving Balance</span>
                <span className="text-on-surface-variant font-mono">0.124</span>
              </div>
              <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden neo-inset p-[1px]">
                <div className="h-full bg-primary/50 rounded-full transition-all duration-1000 ease-out" style={{ width: '35%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Contributors Summary */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Top Positive Contributors (Reduces Risk) */}
          <div className="p-6 rounded-2xl neo-raised bg-background">
            <h4 className="font-semibold text-sm text-green-600 flex items-center gap-2 mb-4 uppercase tracking-wider">
              <TrendingDown className="w-4 h-4 text-green-600" />
              Risk Mitigators
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center justify-between p-3 rounded-xl neo-inset bg-[#e2e4ea]">
                <span className="text-sm font-medium">Home Ownership (Mortgage)</span>
                <span className="text-xs font-bold text-green-600 font-mono">+12.0%</span>
              </li>
              <li className="flex items-center justify-between p-3 rounded-xl neo-inset bg-[#e2e4ea]">
                <span className="text-sm font-medium">Verified Income Source</span>
                <span className="text-xs font-bold text-green-600 font-mono">+8.5%</span>
              </li>
              <li className="flex items-center justify-between p-3 rounded-xl neo-inset bg-[#e2e4ea]">
                <span className="text-sm font-medium">Advanced Degree</span>
                <span className="text-xs font-bold text-green-600 font-mono">+4.2%</span>
              </li>
            </ul>
          </div>

          {/* Top Negative Contributors (Increases Risk) */}
          <div className="p-6 rounded-2xl neo-raised bg-background">
            <h4 className="font-semibold text-sm text-red-500 flex items-center gap-2 mb-4 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-red-500" />
              Risk Drivers
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center justify-between p-3 rounded-xl neo-inset bg-[#e2e4ea]">
                <span className="text-sm font-medium">Revolving Utilization &gt; 80%</span>
                <span className="text-xs font-bold text-red-500 font-mono">-15.4%</span>
              </li>
              <li className="flex items-center justify-between p-3 rounded-xl neo-inset bg-[#e2e4ea]">
                <span className="text-sm font-medium">Recent Missed Payment</span>
                <span className="text-xs font-bold text-red-500 font-mono">-11.2%</span>
              </li>
              <li className="flex items-center justify-between p-3 rounded-xl neo-inset bg-[#e2e4ea]">
                <span className="text-sm font-medium">Short Credit History &lt; 2 yrs</span>
                <span className="text-xs font-bold text-red-500 font-mono">-9.8%</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Local Explanation Section */}
      <div className="p-8 rounded-2xl neo-raised bg-background">
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
          <div className="flex items-center gap-4">
            <div className="neo-inset px-4 py-2 rounded-full flex items-center gap-2 w-64 bg-[#e8eaf0]">
              <Search className="w-4 h-4 text-outline" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-xs w-full p-0 font-medium placeholder:text-outline text-on-surface"
                placeholder="Search Application ID..."
              />
            </div>
            <div className="h-8 w-[1px] bg-outline-variant"></div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Base Risk</p>
              <p className="text-lg font-bold text-on-surface font-mono">0.42</p>
            </div>
            <div className="w-[1px] h-8 bg-outline-variant"></div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Final Risk</p>
              <p className="text-lg font-bold text-primary font-mono">0.78</p>
            </div>
          </div>
        </div>

        {/* Force Plot Visualization Placeholder */}
        <div className="relative h-56 w-full neo-inset rounded-2xl bg-[#e2e4ea] flex flex-col items-center justify-center overflow-hidden p-6">
          <div className="absolute inset-0 flex items-center px-12">
            {/* Negative Forces (Risk Drivers - Red) */}
            <div className="flex-1 flex flex-col items-end gap-2 pr-6">
              <div className="h-8 w-[80%] bg-red-500/20 border-r-4 border-red-500 rounded-l-lg flex items-center justify-end pr-3">
                <span className="text-[10px] font-bold text-red-800 uppercase font-mono">Utilization = 82% (-15.4%)</span>
              </div>
              <div className="h-8 w-[60%] bg-red-500/20 border-r-4 border-red-500 rounded-l-lg flex items-center justify-end pr-3">
                <span className="text-[10px] font-bold text-red-800 uppercase font-mono">3 Inquiries Last 6mo (-9.8%)</span>
              </div>
              <div className="h-8 w-[40%] bg-red-500/20 border-r-4 border-red-500 rounded-l-lg flex items-center justify-end pr-3">
                <span className="text-[10px] font-bold text-red-800 uppercase font-mono">Debt-to-Inc = 42% (-6.2%)</span>
              </div>
            </div>

            {/* Center Point Circle */}
            <div className="z-10 w-16 h-16 rounded-full bg-background neo-raised flex flex-col items-center justify-center border-2 border-primary shrink-0">
              <span className="text-xs font-bold text-on-surface-variant uppercase text-[8px]">Output</span>
              <span className="text-sm font-extrabold text-primary font-mono leading-none">0.78</span>
            </div>

            {/* Positive Forces (Mitigators - Green) */}
            <div className="flex-1 flex flex-col items-start gap-2 pl-6">
              <div className="h-8 w-[70%] bg-green-500/25 border-l-4 border-green-500 rounded-r-lg flex items-center justify-start pl-3">
                <span className="text-[10px] font-bold text-green-700 uppercase font-mono">Age = 42 (+12.0%)</span>
              </div>
              <div className="h-8 w-[50%] bg-green-500/25 border-l-4 border-green-500 rounded-r-lg flex items-center justify-start pl-3">
                <span className="text-[10px] font-bold text-green-700 uppercase font-mono">Employment &gt; 5 yrs (+8.5%)</span>
              </div>
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

        {/* Local metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="p-5 rounded-xl neo-raised bg-background">
            <h5 className="text-xs font-bold text-on-surface-variant uppercase mb-3">Model Confidence</h5>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#d6d8de" strokeWidth="3"></circle>
                  <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#6366f1" strokeDasharray="92, 100" strokeWidth="3"></circle>
                </svg>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold font-mono">92%</span>
              </div>
              <p className="text-xs leading-relaxed text-on-surface-variant">
                High fidelity explanation. SHAP residuals are within acceptable 2% tolerance.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl neo-raised bg-background">
            <h5 className="text-xs font-bold text-on-surface-variant uppercase mb-3">Interaction Alerts</h5>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed text-on-surface-variant">
                Feature <span className="font-semibold text-on-surface">Total Credit Limit</span> interacted strongly with <span className="font-semibold text-on-surface">Payment History</span> for this specific applicant.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl neo-raised bg-background">
            <h5 className="text-xs font-bold text-on-surface-variant uppercase mb-3">Action Recommended</h5>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed text-on-surface-variant">
                Standard automatic processing recommended. The decision is highly stable under local perturbance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Asymmetric Bottom Section */}
      <div className="grid grid-cols-12 gap-8">
        {/* Dependence Plot */}
        <div className="col-span-12 lg:col-span-7 p-6 rounded-2xl neo-raised bg-background h-80 relative overflow-hidden">
          <h4 className="font-semibold text-lg flex items-center gap-2 mb-4 text-on-surface">
            <ScatterChart className="w-5 h-5 text-tertiary" />
            Feature Dependence: Income vs. SHAP
          </h4>

          <div className="w-full h-44 neo-inset rounded-xl bg-[#e2e4ea] flex items-center justify-center p-4 relative">
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
        <div className="col-span-12 lg:col-span-5 p-8 rounded-2xl bg-indigo-900 text-white neo-raised flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              System Insight
            </span>
            <h4 className="text-2xl font-bold mt-2 text-white">Feature Shift Detected</h4>
            <p className="mt-4 opacity-90 text-xs leading-relaxed">
              The explainability engine has noted a 4% shift in feature importance for 'Employment Tenure' over the last 30 days. Consider retraining the model with recent quarterly data.
            </p>
          </div>
          <button className="mt-6 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/20 font-bold text-xs">
            Analyze Shift Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExplainabilityPage;
