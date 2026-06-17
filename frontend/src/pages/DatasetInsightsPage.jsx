import React, { useState } from 'react';
import { 
  Database, 
  AlertOctagon, 
  HelpCircle, 
  List, 
  TrendingUp, 
  CheckCircle2, 
  Search, 
  Download 
} from 'lucide-react';

export function DatasetInsightsPage() {
  const [activeFeature, setActiveFeature] = useState('Income');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h3 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Dataset Insights</h3>
          <p className="text-on-surface-variant mt-1">
            Analyzing 1.2M records • Updated 2 hours ago
          </p>
        </div>
        <div className="relative group">
          <div className="neo-inset px-4 py-2 rounded-full flex items-center gap-2 w-64 transition-all focus-within:w-80 bg-[#e8eaf0]">
            <Search className="w-4 h-4 text-on-surface-variant/60" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-xs w-full p-0 text-on-surface placeholder:text-on-surface-variant/60" 
              placeholder="Search features..." 
            />
          </div>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="neo-raised p-6 rounded-2xl bg-background flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Records</p>
            <Database className="text-primary w-5 h-5" />
          </div>
          <p className="text-2xl font-bold mt-2 font-mono">1,248,392</p>
          <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            +12.4% from last batch
          </div>
        </div>

        <div className="neo-raised p-6 rounded-2xl bg-background flex flex-col justify-between">
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

        <div className="neo-raised p-6 rounded-2xl bg-background flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Outlier Ratio</p>
            <AlertOctagon className="text-amber-500 w-5 h-5" />
          </div>
          <p className="text-2xl font-bold mt-2 font-mono">1.84%</p>
          <div className="flex items-center gap-1 text-[10px] text-on-surface-variant font-bold mt-2">
            <HelpCircle className="w-3.5 h-3.5" />
            Mostly in 'Annual_Income'
          </div>
        </div>

        <div className="neo-raised p-6 rounded-2xl bg-background flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Feature Count</p>
            <List className="text-primary w-5 h-5" />
          </div>
          <p className="text-2xl font-bold mt-2 font-mono">142</p>
          <div className="flex items-center gap-1 text-[10px] text-on-surface-variant font-bold mt-2">
            12 categorical • 130 numeric
          </div>
        </div>
      </div>

      {/* Main Insights Section (Bento Grid) */}
      <div className="grid grid-cols-12 gap-8">
        {/* Distribution Histograms */}
        <div className="col-span-12 lg:col-span-8 neo-raised p-8 rounded-3xl bg-background overflow-hidden relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h3 className="text-lg font-bold text-on-surface">Feature Distribution</h3>
              <p className="text-xs text-on-surface-variant">Analyzing density across primary risk factors</p>
            </div>
            <div className="neo-inset p-1 rounded-xl flex gap-1 bg-[#e8eaf0]">
              {['Income', 'Credit Score', 'Loan Amount'].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFeature(f)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeFeature === f ? 'neo-raised text-primary bg-[#e8eaf0]' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 px-4">
            {/* Simulated Histogram Bars */}
            <div className="w-full bg-primary/20 rounded-t-lg h-[20%] transition-all hover:scale-y-105 duration-350 cursor-pointer"></div>
            <div className="w-full bg-primary/30 rounded-t-lg h-[35%] transition-all hover:scale-y-105 duration-350 cursor-pointer"></div>
            <div className="w-full bg-primary/40 rounded-t-lg h-[55%] transition-all hover:scale-y-105 duration-350 cursor-pointer"></div>
            <div className="w-full bg-primary/50 rounded-t-lg h-[75%] transition-all hover:scale-y-105 duration-350 cursor-pointer"></div>
            <div className="w-full bg-gradient-to-t from-primary to-tertiary rounded-t-lg h-[95%] transition-all hover:scale-y-105 duration-350 cursor-pointer"></div>
            <div className="w-full bg-primary/80 rounded-t-lg h-[80%] transition-all hover:scale-y-105 duration-350 cursor-pointer"></div>
            <div className="w-full bg-primary/60 rounded-t-lg h-[60%] transition-all hover:scale-y-105 duration-350 cursor-pointer"></div>
            <div className="w-full bg-primary/50 rounded-t-lg h-[45%] transition-all hover:scale-y-105 duration-350 cursor-pointer"></div>
            <div className="w-full bg-primary/40 rounded-t-lg h-[30%] transition-all hover:scale-y-105 duration-350 cursor-pointer"></div>
            <div className="w-full bg-primary/30 rounded-t-lg h-[20%] transition-all hover:scale-y-105 duration-350 cursor-pointer"></div>
            <div className="w-full bg-primary/20 rounded-t-lg h-[15%] transition-all hover:scale-y-105 duration-350 cursor-pointer"></div>
            <div className="w-full bg-primary/10 rounded-t-lg h-[8%] transition-all hover:scale-y-105 duration-350 cursor-pointer"></div>
          </div>
          <div className="flex justify-between mt-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-mono">
            <span>{activeFeature === 'Income' ? '$0' : activeFeature === 'Credit Score' ? '300' : '$0'}</span>
            <span>{activeFeature === 'Income' ? '$50k' : activeFeature === 'Credit Score' ? '500' : '$10k'}</span>
            <span>{activeFeature === 'Income' ? '$100k' : activeFeature === 'Credit Score' ? '700' : '$20k'}</span>
            <span>{activeFeature === 'Income' ? '$150k' : activeFeature === 'Credit Score' ? '800' : '$30k'}</span>
            <span>{activeFeature === 'Income' ? '$200k+' : activeFeature === 'Credit Score' ? '850' : '$40k+'}</span>
          </div>
        </div>

        {/* Summary Statistics Card */}
        <div className="col-span-12 lg:col-span-4 neo-raised p-8 rounded-3xl bg-background flex flex-col">
          <h3 className="text-lg font-bold text-on-surface mb-6">Variable Statistics</h3>
          <div className="flex-1 space-y-5">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-on-surface-variant">Mean</span>
                <span className="font-bold text-on-surface font-mono">$72,492.00</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden neo-inset p-[1px]">
                <div className="h-full bg-primary rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-on-surface-variant">Median</span>
                <span className="font-bold text-on-surface font-mono">$68,000.00</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden neo-inset p-[1px]">
                <div className="h-full bg-primary rounded-full" style={{ width: '62%' }}></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-on-surface-variant">Std. Deviation</span>
                <span className="font-bold text-on-surface font-mono">$14,203.11</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden neo-inset p-[1px]">
                <div className="h-full bg-tertiary rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-on-surface-variant">Skewness</span>
                <span className="font-bold text-red-500 font-mono">1.42 (High)</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden neo-inset p-[1px]">
                <div className="h-full bg-red-500 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
          <button className="mt-8 w-full neo-raised py-3 rounded-xl font-bold text-primary active:scale-95 transition-all text-xs bg-[#e8eaf0]">
            Download Statistics CSV
          </button>
        </div>
      </div>

      {/* Correlation Matrix */}
      <div className="neo-raised p-8 rounded-3xl bg-background">
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
            {['Age', 'Income', 'DTI Ratio', 'Credit Score', 'Delinquency', 'Utilization'].map((h) => (
              <div key={h} className="text-[10px] font-bold text-center uppercase tracking-tighter truncate text-on-surface-variant">{h}</div>
            ))}
            
            {/* Row 1: Age */}
            <div className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant flex items-center">Age</div>
            <div className="aspect-square neo-inset rounded-lg flex items-center justify-center bg-primary text-white text-xs font-bold font-mono">1.0</div>
            <div className="aspect-square neo-inset rounded-lg flex items-center justify-center bg-primary/40 text-on-surface text-xs font-bold font-mono">0.4</div>
            <div className="aspect-square neo-inset rounded-lg flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">-0.1</div>
            <div className="aspect-square neo-inset rounded-lg flex items-center justify-center bg-primary/20 text-on-surface text-xs font-bold font-mono">0.2</div>
            <div className="aspect-square neo-inset rounded-lg flex items-center justify-center bg-red-500/20 text-on-surface text-xs font-bold font-mono">-0.2</div>
            <div className="aspect-square neo-inset rounded-lg flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">0.0</div>

            {/* Row 2: Income */}
            <div className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant flex items-center">Income</div>
            <div className="aspect-square neo-inset rounded-lg flex items-center justify-center bg-primary/40 text-on-surface text-xs font-bold font-mono">0.4</div>
            <div className="aspect-square neo-inset rounded-lg flex items-center justify-center bg-primary text-white text-xs font-bold font-mono">1.0</div>
            <div className="aspect-square neo-inset rounded-lg flex items-center justify-center bg-red-500/40 text-on-surface text-xs font-bold font-mono">-0.5</div>
            <div className="aspect-square neo-inset rounded-lg flex items-center justify-center bg-primary/60 text-on-surface text-xs font-bold font-mono">0.7</div>
            <div className="aspect-square neo-inset rounded-lg flex items-center justify-center bg-red-500/10 text-on-surface text-xs font-bold font-mono">-0.1</div>
            <div className="aspect-square neo-inset rounded-lg flex items-center justify-center bg-red-500/30 text-on-surface text-xs font-bold font-mono">-0.3</div>

            {/* Row 3: DTI */}
            <div className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant flex items-center">DTI Ratio</div>
            <div className="aspect-square neo-inset rounded-lg flex items-center justify-center bg-[#d6d8de] text-on-surface-variant text-xs font-bold font-mono">-0.1</div>
            <div className="aspect-square neo-inset rounded-lg flex items-center justify-center bg-red-500/40 text-on-surface text-xs font-bold font-mono">-0.5</div>
            <div className="aspect-square neo-inset rounded-lg flex items-center justify-center bg-primary text-white text-xs font-bold font-mono">1.0</div>
            <div className="aspect-square neo-inset rounded-lg flex items-center justify-center bg-red-500/60 text-on-surface text-xs font-bold font-mono">-0.8</div>
            <div className="aspect-square neo-inset rounded-lg flex items-center justify-center bg-primary/60 text-on-surface text-xs font-bold font-mono">0.6</div>
            <div className="aspect-square neo-inset rounded-lg flex items-center justify-center bg-primary/80 text-on-surface text-xs font-bold font-mono">0.9</div>
          </div>
        </div>
      </div>

      {/* Missing Values / Health Drilldown */}
      <div className="neo-raised p-8 rounded-3xl bg-background overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-on-surface">Health Status by Feature</h3>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full neo-inset text-[10px] font-bold text-green-700 bg-green-50 font-mono">STABLE</span>
            <span className="px-3 py-1 rounded-full neo-inset text-[10px] font-bold text-red-600 bg-red-50 font-mono">NEEDS REVIEW</span>
          </div>
        </div>
        <table className="w-full text-left border-separate border-spacing-y-4">
          <thead>
            <tr class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-4">
              <th className="pb-2 pl-4">Feature Name</th>
              <th className="pb-2">Data Type</th>
              <th className="pb-2">Missing Values</th>
              <th className="pb-2">Distinct Values</th>
              <th className="pb-2">Status</th>
              <th className="pb-2 pr-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr className="neo-inset rounded-xl overflow-hidden bg-white/40">
              <td className="py-4 pl-6 font-semibold text-sm">annual_income</td>
              <td className="py-4 text-xs font-mono">float64</td>
              <td className="py-4 text-sm font-mono">12 (0.001%)</td>
              <td className="py-4 text-sm font-mono">48,291</td>
              <td className="py-4">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold">STABLE</span>
              </td>
              <td className="py-4 pr-6 text-right">
                <button className="text-primary hover:underline text-xs font-bold">Inspect</button>
              </td>
            </tr>
            <tr className="neo-inset rounded-xl overflow-hidden bg-white/40">
              <td className="py-4 pl-6 font-semibold text-sm">home_ownership</td>
              <td className="py-4 text-xs font-mono">category</td>
              <td className="py-4 text-sm font-mono">0 (0.000%)</td>
              <td className="py-4 text-sm font-mono">5</td>
              <td className="py-4">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold">STABLE</span>
              </td>
              <td className="py-4 pr-6 text-right">
                <button className="text-primary hover:underline text-xs font-bold">Inspect</button>
              </td>
            </tr>
            <tr className="neo-inset rounded-xl overflow-hidden bg-red-500/5">
              <td className="py-4 pl-6 font-semibold text-sm">employment_history</td>
              <td className="py-4 text-xs font-mono">int64</td>
              <td className="py-4 text-sm font-mono">4,812 (0.38%)</td>
              <td className="py-4 text-sm font-mono">42</td>
              <td className="py-4">
                <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-[10px] font-bold">IMPUTE REQUIRED</span>
              </td>
              <td className="py-4 pr-6 text-right">
                <button className="text-red-600 hover:underline text-xs font-bold">Clean</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DatasetInsightsPage;
