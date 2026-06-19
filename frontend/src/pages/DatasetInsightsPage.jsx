import React, { useState } from 'react';
import {
  Database,
  AlertOctagon,
  HelpCircle,
  List,
  TrendingUp,
  CheckCircle2,
  Search
} from 'lucide-react';

export function DatasetInsightsPage() {
  const [activeFeature, setActiveFeature] = useState('Income');
  const [searchTerm, setSearchTerm] = useState('');

  const FEATURE_STATS = {
    'Income': {
      mean: '$174,347.54',
      median: '$144,000.00',
      stdDev: '$888,708.62',
      skewness: '129.84 (High)',
      skewnessColor: 'text-red-500',
      meanWidth: '68%',
      medianWidth: '60%',
      stdWidth: '85%',
      skewWidth: '95%'
    },
    'Credit Score': {
      mean: '582.02',
      median: '609.00',
      stdDev: '104.84',
      skewness: '-0.78 (Moderate)',
      skewnessColor: 'text-amber-500',
      meanWidth: '68%',
      medianWidth: '72%',
      stdWidth: '25%',
      skewWidth: '35%'
    },
    'Loan Amount': {
      mean: '$597,306.71',
      median: '$509,400.00',
      stdDev: '$401,029.52',
      skewness: '1.21 (High)',
      skewnessColor: 'text-red-500',
      meanWidth: '75%',
      medianWidth: '65%',
      stdWidth: '50%',
      skewWidth: '60%'
    },
    'Age': {
      mean: '43.21 Yrs',
      median: '41.00 Yrs',
      stdDev: '12.42 Yrs',
      skewness: '0.34 (Low)',
      skewnessColor: 'text-green-500',
      meanWidth: '60%',
      medianWidth: '57%',
      stdWidth: '28%',
      skewWidth: '20%'
    },
    'DTI Ratio': {
      mean: '0.28',
      median: '0.24',
      stdDev: '0.15',
      skewness: '1.15 (High)',
      skewnessColor: 'text-red-500',
      meanWidth: '50%',
      medianWidth: '45%',
      stdWidth: '30%',
      skewWidth: '75%'
    },
    'Years at Job': {
      mean: '6.42 Yrs',
      median: '4.00 Yrs',
      stdDev: '6.20 Yrs',
      skewness: '2.14 (High)',
      skewnessColor: 'text-red-500',
      meanWidth: '45%',
      medianWidth: '30%',
      stdWidth: '42%',
      skewWidth: '85%'
    },
    'Assets Value': {
      mean: '$104,180.20',
      median: '$25,000.00',
      stdDev: '$112,450.50',
      skewness: '1.85 (High)',
      skewnessColor: 'text-red-500',
      meanWidth: '55%',
      medianWidth: '25%',
      stdWidth: '68%',
      skewWidth: '80%'
    },
    'Dependents': {
      mean: '0.52',
      median: '0.00',
      stdDev: '0.85',
      skewness: '2.58 (High)',
      skewnessColor: 'text-red-500',
      meanWidth: '25%',
      medianWidth: '10%',
      stdWidth: '35%',
      skewWidth: '95%'
    },
    'Previous Defaults': {
      mean: '0.12',
      median: '0.00',
      stdDev: '0.45',
      skewness: '4.12 (High)',
      skewnessColor: 'text-red-500',
      meanWidth: '15%',
      medianWidth: '10%',
      stdWidth: '20%',
      skewWidth: '98%'
    },
    'Payment History': {
      mean: 'N/A (Cat)',
      median: 'Good',
      stdDev: 'N/A (Cat)',
      skewness: 'N/A',
      skewnessColor: 'text-slate-500',
      meanWidth: '10%',
      medianWidth: '80%',
      stdWidth: '10%',
      skewWidth: '10%'
    },
    'Loan Purpose': {
      mean: 'N/A (Cat)',
      median: 'Personal',
      stdDev: 'N/A (Cat)',
      skewness: 'N/A',
      skewnessColor: 'text-slate-500',
      meanWidth: '10%',
      medianWidth: '80%',
      stdWidth: '10%',
      skewWidth: '10%'
    }
  };

  const FEATURE_DISTRIBUTIONS = {
    'Income': [95, 75, 55, 38, 26, 18, 12, 8, 5, 3, 2, 1],
    'Credit Score': [5, 8, 12, 18, 28, 45, 68, 88, 95, 70, 40, 15],
    'Loan Amount': [10, 18, 32, 50, 72, 90, 82, 60, 42, 28, 16, 8],
    'Age': [10, 22, 45, 68, 85, 92, 80, 62, 40, 25, 12, 5],
    'DTI Ratio': [20, 55, 88, 95, 75, 50, 30, 18, 10, 5, 2, 1],
    'Years at Job': [95, 70, 48, 32, 22, 15, 10, 7, 5, 3, 2, 1],
    'Assets Value': [75, 95, 40, 20, 15, 12, 45, 50, 25, 10, 5, 2],
    'Dependents': [95, 45, 15, 5, 1, 0, 0, 0, 0, 0, 0, 0],
    'Previous Defaults': [98, 8, 2, 0.5, 0.1, 0, 0, 0, 0, 0, 0, 0],
    'Payment History': [15, 30, 55, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'Loan Purpose': [18, 22, 15, 20, 25, 0, 0, 0, 0, 0, 0, 0]
  };

  const FEATURE_AXES = {
    'Income': ['$0', '$50k', '$100k', '$150k', '$200k+'],
    'Credit Score': ['300', '500', '700', '800', '850'],
    'Loan Amount': ['$0', '$250k', '$500k', '$750k', '$1M+'],
    'Age': ['18', '30', '45', '60', '75+'],
    'DTI Ratio': ['0.0', '0.2', '0.4', '0.6', '0.8+'],
    'Years at Job': ['0', '5', '10', '15', '20+'],
    'Assets Value': ['$0', '$30k', '$60k', '$100k', '$150k+'],
    'Dependents': ['0', '1', '2', '3', '4+'],
    'Previous Defaults': ['0', '1', '2', '3', '4+'],
    'Payment History': ['Poor', 'Fair', 'Good', '', ''],
    'Loan Purpose': ['Auto', 'Business', 'Education', 'Home', 'Personal']
  };

  const handleInspect = (featureName) => {
    setActiveFeature(featureName);
    const element = document.getElementById('distribution-chart');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h3 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Dataset Insights</h3>
          <p className="text-on-surface-variant mt-1">
            Analyzing 458,511 records • Updated 2 hours ago
          </p>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl border border-slate-100 shadow-sm bg-white flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Records</p>
            <Database className="text-primary w-5 h-5" />
          </div>
          <p className="text-2xl font-bold mt-2 font-mono">458,511</p>
          <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold mt-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Stratified 70/15/15 split
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-100 shadow-sm bg-white flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Missing Values</p>
            <AlertOctagon className="text-red-500 w-5 h-5" />
          </div>
          <p className="text-2xl font-bold mt-2 font-mono">0.042%</p>
          <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold mt-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Below threshold (0.5%)
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-100 shadow-sm bg-white flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Outlier Ratio</p>
            <AlertOctagon className="text-amber-500 w-5 h-5" />
          </div>
          <p className="text-2xl font-bold mt-2 font-mono">11.24%</p>
          <div className="flex items-center gap-1 text-[10px] text-on-surface-variant font-bold mt-2">
            <HelpCircle className="w-3.5 h-3.5" />
            Mostly in 'income'
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-100 shadow-sm bg-white flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Feature Count</p>
            <List className="text-primary w-5 h-5" />
          </div>
          <p className="text-2xl font-bold mt-2 font-mono">24</p>
          <div className="flex items-center gap-1 text-[10px] text-on-surface-variant font-bold mt-2">
            6 categorical • 18 numeric
          </div>
        </div>
      </div>

      {/* Main Insights Section (Bento Grid) */}
      <div className="grid grid-cols-12 gap-8">
        {/* Distribution Histograms */}
        <div id="distribution-chart" className="col-span-12 lg:col-span-8 p-8 rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h3 className="text-lg font-bold text-on-surface">Feature Distribution</h3>
              <p className="text-xs text-on-surface-variant">Analyzing density across primary risk factors</p>
            </div>
            <div className="p-1 rounded-xl flex flex-wrap gap-1 bg-slate-100 border border-slate-200">
              {Array.from(new Set(['Income', 'Credit Score', 'Loan Amount', activeFeature])).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFeature(f)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeFeature === f ? 'text-indigo-600 bg-white shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 px-4">
            {/* Simulated Histogram Bars */}
            {FEATURE_DISTRIBUTIONS[activeFeature].map((height, idx) => {
              const opacityClass = height < 10 ? 'bg-primary/10' :
                height < 25 ? 'bg-primary/20' :
                  height < 45 ? 'bg-primary/40' :
                    height < 65 ? 'bg-primary/60' :
                      height < 85 ? 'bg-primary/80' :
                        'bg-gradient-to-t from-primary to-tertiary';
              return (
                <div
                  key={idx}
                  style={{ height: `${height}%` }}
                  className={`w-full rounded-t-lg transition-all hover:scale-y-105 duration-350 cursor-pointer ${opacityClass}`}
                ></div>
              );
            })}
          </div>
          <div className="flex justify-between mt-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-mono">
            {FEATURE_AXES[activeFeature].map((label, idx) => (
              <span key={idx}>{label}</span>
            ))}
          </div>
        </div>

        {/* Summary Statistics Card */}
        <div className="col-span-12 lg:col-span-4 p-8 rounded-2xl border border-slate-100 shadow-sm bg-white flex flex-col">
          <h3 className="text-lg font-bold text-on-surface mb-6">Variable Statistics: {activeFeature}</h3>
          <div className="flex-1 space-y-5">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-on-surface-variant">Mean</span>
                <span className="font-bold text-on-surface font-mono">{FEATURE_STATS[activeFeature].mean}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                <div className="h-full bg-primary rounded-full" style={{ width: FEATURE_STATS[activeFeature].meanWidth }}></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-on-surface-variant">Median</span>
                <span className="font-bold text-on-surface font-mono">{FEATURE_STATS[activeFeature].median}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                <div className="h-full bg-primary rounded-full" style={{ width: FEATURE_STATS[activeFeature].medianWidth }}></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-on-surface-variant">Std. Deviation</span>
                <span className="font-bold text-on-surface font-mono">{FEATURE_STATS[activeFeature].stdDev}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                <div className="h-full bg-tertiary rounded-full" style={{ width: FEATURE_STATS[activeFeature].stdWidth }}></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-on-surface-variant">Skewness</span>
                <span className={`font-bold font-mono ${FEATURE_STATS[activeFeature].skewnessColor}`}>{FEATURE_STATS[activeFeature].skewness}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                <div className={`h-full rounded-full ${FEATURE_STATS[activeFeature].skewness.includes('High') ? 'bg-red-500' :
                  FEATURE_STATS[activeFeature].skewness.includes('Moderate') ? 'bg-amber-500' :
                    FEATURE_STATS[activeFeature].skewness.includes('Low') ? 'bg-green-500' :
                      'bg-slate-400'
                  }`} style={{ width: FEATURE_STATS[activeFeature].skewWidth }}></div>
              </div>
            </div>
          </div>
          {/* Download button removed */}
        </div>
      </div>

      {/* Correlation Matrix */}
      <div className="p-8 rounded-2xl border border-slate-100 shadow-sm bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Correlation Matrix</h3>
            <p className="text-xs text-on-surface-variant">Relationship intensity between training variables</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-primary"></div> Strong Positive
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#d6d8de]"></div> Neutral
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-red-500/60"></div> Strong Negative
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[600px] grid grid-cols-7 gap-3">
            <div className="col-span-1"></div>
            {['Age', 'Income', 'DTI Ratio', 'Credit Score', 'Delinquency', 'Loan Amt'].map((h) => (
              <div key={h} className="text-[10px] font-bold text-center uppercase tracking-tighter truncate text-on-surface-variant">{h}</div>
            ))}

            {/* Row 1: Age */}
            <div className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant flex items-center">Age</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-primary text-white text-xs font-bold font-mono">+1.00</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">-0.01</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">+0.05</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-primary/10 text-on-surface-variant text-xs font-bold font-mono">+0.11</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">-0.00</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-primary/10 text-on-surface-variant text-xs font-bold font-mono">+0.06</div>

            {/* Row 2: Income */}
            <div className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant flex items-center">Income</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">-0.01</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-primary text-white text-xs font-bold font-mono">+1.00</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-red-500/10 text-on-surface-variant text-xs font-bold font-mono">-0.10</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">+0.00</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">-0.01</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-primary/10 text-on-surface-variant text-xs font-bold font-mono">+0.04</div>

            {/* Row 3: DTI Ratio */}
            <div className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant flex items-center">DTI Ratio</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">+0.05</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-red-500/10 text-on-surface-variant text-xs font-bold font-mono">-0.10</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-primary text-white text-xs font-bold font-mono">+1.00</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">-0.02</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">+0.01</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-primary/20 text-on-surface-variant text-xs font-bold font-mono">+0.23</div>

            {/* Row 4: Credit Score */}
            <div className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant flex items-center">Credit Score</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-primary/10 text-on-surface-variant text-xs font-bold font-mono">+0.11</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">+0.00</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">-0.02</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-primary text-white text-xs font-bold font-mono">+1.00</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">-0.03</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-primary/10 text-on-surface-variant text-xs font-bold font-mono">+0.14</div>

            {/* Row 5: Delinquency */}
            <div className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant flex items-center">Delinquency</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">-0.00</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">-0.01</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">+0.01</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">-0.03</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-primary text-white text-xs font-bold font-mono">+1.00</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">-0.01</div>

            {/* Row 6: Loan Amt */}
            <div className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant flex items-center">Loan Amt</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">+0.06</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">+0.04</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-primary/20 text-on-surface-variant text-xs font-bold font-mono">+0.23</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-primary/10 text-on-surface-variant text-xs font-bold font-mono">+0.14</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">-0.01</div>
            <div className="aspect-square rounded-lg border border-slate-200/50 flex items-center justify-center bg-primary text-white text-xs font-bold font-mono">+1.00</div>
          </div>
        </div>
      </div>

      {/* Missing Values / Health Drilldown */}
      <div className="p-8 rounded-2xl border border-slate-100 shadow-sm bg-white overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-on-surface">Health Status by Feature</h3>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold text-green-700 bg-green-50 border border-green-200/50 font-mono">STABLE</span>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold text-red-600 bg-red-50 border border-red-200/50 font-mono">NEEDS REVIEW</span>
          </div>
        </div>
        <table className="w-full text-left border-separate border-spacing-y-4">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-4">
              <th className="pb-2 pl-4">Feature Name</th>
              <th className="pb-2">Data Type</th>
              <th className="pb-2">Missing Values</th>
              <th className="pb-2">Distinct Values</th>
              <th className="pb-2">Status</th>
              <th className="pb-2 pr-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const allFeatures = [
                { name: 'income', displayName: 'Income', type: 'float64', missing: '0 (0.00%)', distinct: '15,482', status: 'STABLE' },
                { name: 'credit_score', displayName: 'Credit Score', type: 'int64', missing: '0 (0.00%)', distinct: '551', status: 'STABLE' },
                { name: 'loan_amount', displayName: 'Loan Amount', type: 'float64', missing: '0 (0.00%)', distinct: '10,482', status: 'STABLE' },
                { name: 'age', displayName: 'Age', type: 'int64', missing: '0 (0.00%)', distinct: '58', status: 'STABLE' },
                { name: 'debt_to_income_ratio', displayName: 'DTI Ratio', type: 'float64', missing: '0 (0.00%)', distinct: '8,924', status: 'STABLE' },
                { name: 'years_at_current_job', displayName: 'Years at Job', type: 'int64', missing: '0 (0.00%)', distinct: '42', status: 'STABLE' },
                { name: 'assets_value', displayName: 'Assets Value', type: 'float64', missing: '0 (0.00%)', distinct: '4', status: 'STABLE' },
                { name: 'number_of_dependents', displayName: 'Dependents', type: 'int64', missing: '0 (0.00%)', distinct: '12', status: 'STABLE' },
                { name: 'previous_defaults', displayName: 'Previous Defaults', type: 'int64', missing: '0 (0.00%)', distinct: '8', status: 'STABLE' },
                { name: 'payment_history', displayName: 'Payment History', type: 'object (string)', missing: '0 (0.00%)', distinct: '3', status: 'STABLE' },
                { name: 'loan_purpose', displayName: 'Loan Purpose', type: 'object (string)', missing: '0 (0.00%)', distinct: '5', status: 'STABLE' }
              ];
              const filtered = allFeatures.filter(f =>
                f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                f.displayName.toLowerCase().includes(searchTerm.toLowerCase())
              );
              if (filtered.length === 0) {
                return (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-on-surface-variant/60 text-xs font-semibold">
                      No features found matching "{searchTerm}"
                    </td>
                  </tr>
                );
              }
              return filtered.map((row) => (
                <tr key={row.name} className="rounded-xl overflow-hidden bg-slate-50/50 border border-slate-100 hover:bg-slate-50/80 transition-all">
                  <td className="py-4 pl-6 font-semibold text-sm">{row.name}</td>
                  <td className="py-4 text-xs font-mono">{row.type}</td>
                  <td className="py-4 text-sm font-mono">{row.missing}</td>
                  <td className="py-4 text-sm font-mono">{row.distinct}</td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold">{row.status}</span>
                  </td>
                  <td className="py-4 pr-6 text-right">
                    <button
                      onClick={() => handleInspect(row.displayName)}
                      className="text-primary hover:underline text-xs font-bold"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DatasetInsightsPage;
