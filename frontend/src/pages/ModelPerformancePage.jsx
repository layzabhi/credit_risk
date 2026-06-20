import React, { useState } from 'react';
import {
  CheckCircle2,
  Target,
  RefreshCw,
  AreaChart,
  Download,
  AlertTriangle,
  TrendingDown,
  Zap
} from 'lucide-react';

export function ModelPerformancePage() {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h3 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Model Performance</h3>
          <p className="text-on-surface-variant mt-1">
            Real-time health telemetry
          </p>
        </div>

      </div>

      {/* Bento Grid - Key Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Accuracy */}
        <div className="p-6 rounded-2xl border border-slate-100 shadow-sm bg-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-full font-mono">+1.2%</span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">Accuracy</p>
          <h4 className="text-3xl font-extrabold text-on-surface mt-1 font-mono">87.7%</h4>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden border border-slate-200 p-[1px]">
            <div className="h-full bg-primary rounded-full" style={{ width: '87.7%' }}></div>
          </div>
        </div>

        {/* Precision */}
        <div className="p-6 rounded-2xl border border-slate-100 shadow-sm bg-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <Target className="w-5 h-5 text-tertiary" />
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant bg-[#e2e4ea] px-2.5 py-1 rounded-full font-mono">Stable</span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">Precision</p>
          <h4 className="text-3xl font-extrabold text-on-surface mt-1 font-mono">35.7%</h4>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden border border-slate-200 p-[1px]">
            <div className="h-full bg-tertiary rounded-full" style={{ width: '35.7%' }}></div>
          </div>
        </div>

        {/* Recall */}
        <div className="p-6 rounded-2xl border border-slate-100 shadow-sm bg-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <RefreshCw className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-[10px] font-bold text-red-500 bg-red-100 px-2.5 py-1 rounded-full font-mono">-0.4%</span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">Recall</p>
          <h4 className="text-3xl font-extrabold text-on-surface mt-1 font-mono">75.0%</h4>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden border border-slate-200 p-[1px]">
            <div className="h-full bg-indigo-400 rounded-full" style={{ width: '75.0%' }}></div>
          </div>
        </div>

        {/* ROC-AUC */}
        <div className="p-6 rounded-2xl border border-slate-100 shadow-sm bg-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <AreaChart className="w-5 h-5 text-secondary-500" />
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-full font-mono">+2.8%</span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">ROC-AUC</p>
          <h4 className="text-3xl font-extrabold text-on-surface mt-1 font-mono">0.895</h4>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden border border-slate-200 p-[1px]">
            <div className="h-full bg-[#64748b] rounded-full" style={{ width: '89.5%' }}></div>
          </div>
        </div>
      </section>

      {/* Middle Section: Drift Chart & Confusion Matrix */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Drift Line Chart */}
        <div className="lg:col-span-2 p-8 rounded-2xl border border-slate-100 shadow-sm bg-white relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h5 className="text-xl font-bold text-on-surface">Performance Stability</h5>
              <p className="text-sm text-on-surface-variant">Daily precision/recall drift over last 30 days</p>
            </div>
            <div className="flex items-center gap-6 text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="text-on-surface">Precision</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-tertiary"></span>
                <span className="text-on-surface">Recall</span>
              </div>
            </div>
          </div>

          {/* Chart Graphic using SVG */}
          <div className="h-64 w-full relative flex items-end justify-between px-2">
            <svg className="absolute inset-0 w-full h-full p-4 pr-6" preserveAspectRatio="none" viewBox="0 0 1000 200">
              {/* Grid Lines */}
              <line x1="0" y1="50" x2="1000" y2="50" stroke="#8a8c9a" strokeWidth="1" strokeDasharray="5,5" opacity="0.15" />
              <line x1="0" y1="100" x2="1000" y2="100" stroke="#8a8c9a" strokeWidth="1" strokeDasharray="5,5" opacity="0.15" />
              <line x1="0" y1="150" x2="1000" y2="150" stroke="#8a8c9a" strokeWidth="1" strokeDasharray="5,5" opacity="0.15" />

              {/* Recall Line (Violet) */}
              <path
                fill="none"
                stroke="#7c3aed"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.35"
                d="M0,150 L100,135 L200,140 L300,120 L400,135 L500,130 L600,140 L700,115 L800,125 L900,120 L1000,110"
              />
              {/* Precision Line (Indigo) */}
              <path
                fill="none"
                stroke="#6366f1"
                strokeWidth="4"
                strokeLinecap="round"
                d="M0,80 L100,70 L200,75 L300,60 L400,85 L500,65 L600,70 L700,55 L800,65 L900,60 L1000,52"
              />

              {/* Anchor points */}
              <circle cx="1000" cy="52" r="5" fill="#6366f1" />
              <circle cx="1000" cy="110" r="5" fill="#7c3aed" />
            </svg>
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-2">
            <span>30 Days Ago</span>
            <span>20 Days Ago</span>
            <span>10 Days Ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Confusion Matrix */}
        <div className="p-8 rounded-2xl border border-slate-100 shadow-sm bg-white">
          <h5 className="text-xl font-bold text-on-surface mb-1">Confusion Matrix</h5>
          <p className="text-xs text-on-surface-variant mb-6">True vs Predicted labels</p>
          <div className="grid grid-cols-2 gap-4">
            {/* Cell TP */}
            <div className="aspect-square flex flex-col items-center justify-center rounded-2xl bg-indigo-50/50 border border-indigo-100">
              <span className="text-primary font-bold text-2xl font-mono">227</span>
              <span className="text-[9px] font-bold text-primary uppercase mt-1">True Positive</span>
            </div>
            {/* Cell FP */}
            <div className="aspect-square flex flex-col items-center justify-center rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-on-surface font-bold text-2xl font-mono">409</span>
              <span className="text-[9px] font-bold text-on-surface-variant uppercase mt-1">False Positive</span>
            </div>
            {/* Cell FN */}
            <div className="aspect-square flex flex-col items-center justify-center rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-on-surface font-bold text-2xl font-mono">76</span>
              <span className="text-[9px] font-bold text-on-surface-variant uppercase mt-1">False Negative</span>
            </div>
            {/* Cell TN */}
            <div className="aspect-square flex flex-col items-center justify-center rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-tertiary font-bold text-2xl font-mono">3,038</span>
              <span className="text-[9px] font-bold text-tertiary uppercase mt-1">True Negative</span>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between text-[10px] font-semibold text-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600/30"></span>
              <span>High Predictability</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
              <span>Indeterminate Region</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section */}
      <section className="flex flex-col xl:flex-row gap-8">
        {/* Data Quality / Sensitivity */}
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 rounded-2xl border border-slate-100 shadow-sm bg-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 border border-slate-100">
                <AlertTriangle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h6 className="text-base font-bold text-on-surface">Feature Sensitivity</h6>
                <p className="text-[11px] text-on-surface-variant">Mean absolute SHAP target impact</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5 text-on-surface">
                  <span>Debt-to-Income</span>
                  <span className="text-primary font-mono">0.82 Impact</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                  <div className="h-full bg-primary rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5 text-on-surface">
                  <span>Payment History</span>
                  <span className="text-primary font-mono">0.64 Impact</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                  <div className="h-full bg-primary rounded-full" style={{ width: '64%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5 text-on-surface">
                  <span>Credit Score</span>
                  <span className="text-primary font-mono">0.45 Impact</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                  <div className="h-full bg-primary rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-2xl border border-slate-100 shadow-sm bg-white flex flex-col justify-center">
            <div className="mb-4">
              <h6 className="text-base font-bold text-on-surface">Inference Speed</h6>
              <p className="text-xs text-on-surface-variant">Global p99 latency in production environment</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-on-surface font-mono tracking-tighter">88</span>
              <span className="text-lg font-bold text-primary">ms</span>
            </div>
            <p className="mt-3 text-[10px] font-bold text-green-600 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              Under 100ms target latency threshold
            </p>
            <div className="mt-6 flex gap-2">
              <div className="h-10 w-full rounded-xl flex items-center justify-center bg-slate-100 border border-slate-200 relative">
                <div className="w-2/3 h-1/2 bg-primary/20 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Snap image decoration */}
        <div className="xl:w-80 h-64 xl:h-auto rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden relative group shrink-0">
          <img
            alt="Model architecture visualization"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBe30oibOe6y-kEDDjnFRTXZYDijCqMzUp4KLd9cubXf695i0LWAKrQL-0tpA2lzJk_9sowXmCu9VTMNq6YSx5jJhY0KGfKhrjpXzU4FmdnsxFvJVAts1MZlesCPaQIMf_TRpp4D5YVNx0GSuCjfon6xAylekZfqOyfORiLnCV1Hfz3YvetORwehsMRhNRxGyHd-jC1yh_tXyJPzFJtKE1aajOjKMcXwsqA347pJDafsTVfsBOfNcyn4PIgAhvdmo1sa_4q1VryFouz"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Model Topology</span>
            <p className="text-white font-extrabold">XGBoost Classifier</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ModelPerformancePage;
