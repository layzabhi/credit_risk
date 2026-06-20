import React, { useState } from 'react';
import {
  FileText,
  Github,
  Mail,
  Linkedin,
  ShieldCheck,
  Eye,
  Scale,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  X,
  ExternalLink,
  BookOpen,
  Cpu,
  BarChart2,
  Database
} from 'lucide-react';

import abhishekPhoto from './Abhishek gupta_passport size.png';
import ranitPhoto from './Ranit Mondal.jpeg';
import prathamPhoto from './Pratham Kumar.jpeg';

export function AboutProjectPage() {
  const [whitepaperOpen, setWhitepaperOpen] = useState(false);

  const scrollToTeam = () => {
    document.getElementById('team-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-12 animate-fadeIn">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-5xl font-headline font-bold tracking-tight text-on-surface leading-tight">
              Pioneering <span className="text-primary">Reliable</span> Credit Risk Assessment.
            </h1>
            <p className="text-base lg:text-lg text-on-surface-variant leading-relaxed">
              RiskLens is an advanced neural-engine designed to harmonize financial prudence with modern data science. We provide transparent, high-precision credit scoring models that empower financial institutions while ensuring consumer fairness.
            </p>
            <div className="flex flex-wrap gap-3">
              {/* Primary CTA — opens whitepaper modal */}
              <button
                onClick={() => setWhitepaperOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm flex items-center gap-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-primary/20"
              >
                <FileText className="w-4 h-4" />
                Read Whitepaper
              </button>
              {/* Secondary CTA — opens GitHub repo */}
              <a
                href="https://github.com/layzabhi/credit_risk"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-on-surface font-semibold text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
              >
                <Github className="w-4 h-4" />
                View on GitHub
              </a>
              {/* Ghost CTA — scrolls to team section */}
              <button
                onClick={scrollToTeam}
                className="px-5 py-2.5 rounded-xl text-on-surface-variant font-semibold text-sm flex items-center gap-2 hover:text-on-surface hover:bg-slate-100 dark:hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Mail className="w-4 h-4" />
                Contact Team
              </button>
            </div>
          </div>
          <div className="relative h-[360px] rounded-2xl overflow-hidden border border-slate-100 shadow-sm p-2 bg-white">
            <img
              alt="Financial Data Visualization"
              className="w-full h-full object-cover rounded-2xl grayscale-[20%]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBfd46eqU9WiqN3DTd5CHcbc4aK0SG3hnrN85QXv6oZvgzkxW5xH-KCcBPm9PkrA7SU9HEwJwAEgo6SJw0VTt_8lEVKRvbrc3lRbhf_70bJoZjz-Y4OgOP0iTvmwrakeLYN_EQ-5LMz5M8XSrQuzMsRNzJSJKfwZ-B7e8r40sW_GS6rK08gXvVVpBHkucUhCqLAKnbWGG_5eJvQJrnJfcQd1s4n8c-yqgLs9iMhaWoKPpV9SHlmuFo_wmXWbtUS6kGMA8Q3Um5PHX-"
            />
          </div>
        </section>

        {/* Goals Bento Grid */}
        <section className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-on-surface tracking-tight">Core Project Goals</h3>
            <p className="text-sm text-on-surface-variant">The pillars of our risk assessment philosophy.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-slate-100 shadow-sm bg-white flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-on-surface">Integrity &amp; Accuracy</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                XGBoost gradient boosting trained on 3 merged credit datasets achieves
                87.7% accuracy and AUC-ROC of 0.8952 — evaluated across 10-fold stratified cross-validation.
              </p>
            </div>
            <div className="p-8 rounded-2xl border border-slate-100 shadow-sm bg-white flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-tertiary">
                <Eye className="w-6 h-6 text-tertiary" />
              </div>
              <h4 className="text-lg font-bold text-on-surface">Model Transparency</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                SHAP TreeExplainer generates per-prediction feature attributions so every decision is
                auditable by stakeholders, underwriters, and regulatory bodies.
              </p>
            </div>
            <div className="p-8 rounded-2xl border border-slate-100 shadow-sm bg-white flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-400">
                <Scale className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-on-surface">Ethical Lending</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Automated bias-detection loops that continuously monitor for demographic disparities and ensure fair lending across all socio-economic groups.
              </p>
            </div>
          </div>
        </section>

        {/* Why This Is Different Section */}
        <section className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-on-surface tracking-tight">Why This Is Different</h3>
            <p className="text-sm text-on-surface-variant">A head-to-head comparison of RiskLens against traditional credit scoring systems.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm bg-white dark:bg-surface overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-3 bg-slate-50 dark:bg-white/[0.04] border-b border-slate-100 dark:border-white/5 px-6 py-4">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Feature</span>
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Traditional Scoring</span>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">RiskLens System</span>
            </div>
            {/* Rows */}
            {[
              {
                feature: 'Decision Speed',
                traditional: '24–48 hours',
                risklens: 'Instant (50ms)',
                highlight: true,
              },
              {
                feature: 'Bias Detection',
                traditional: 'Manual review',
                risklens: 'Automated monitoring',
                highlight: false,
              },
              {
                feature: 'Explainability',
                traditional: 'Black box',
                risklens: 'SHAP values',
                highlight: true,
              },
              {
                feature: 'Model Updates',
                traditional: 'Quarterly',
                risklens: 'Continuous',
                highlight: false,
              },
              {
                feature: 'Discrimination Ability',
                traditional: 'AUC ~0.70',
                risklens: 'AUC 0.89',
                highlight: true,
              },
            ].map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 px-6 py-4 border-b border-slate-100 dark:border-white/5 last:border-b-0 transition-colors hover:bg-slate-50/60 dark:hover:bg-white/[0.03] ${row.highlight ? 'bg-primary/[0.02] dark:bg-primary/[0.05]' : ''}`}
              >
                <span className="text-sm font-semibold text-on-surface">{row.feature}</span>
                <span className="text-sm text-on-surface-variant">{row.traditional}</span>
                <span className="text-sm font-semibold text-primary flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                  {row.risklens}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Challenges & Trade-offs Section */}
        <section className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-on-surface tracking-tight">Challenges &amp; Trade-offs</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1 — Precision/Recall */}
            <div className="rounded-2xl border border-amber-100 dark:border-amber-400/10 bg-amber-50/60 dark:bg-amber-400/5 p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-400/10 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-5 h-5 text-amber-500" />
                </div>
                <h4 className="font-bold text-on-surface text-sm leading-tight">Precision / Recall Trade-off</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-xs font-bold text-emerald-500 shrink-0">✓</span>
                  <p className="text-xs text-on-surface-variant">Optimised for <span className="font-semibold text-on-surface">75% recall</span> — catch most defaults</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-xs font-bold text-amber-500 shrink-0">→</span>
                  <p className="text-xs text-on-surface-variant">Accept <span className="font-semibold text-on-surface">32% false positive rate</span> — denies some good customers</p>
                </div>
                <div className="mt-3 px-3 py-2 rounded-lg bg-amber-100/80 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/10">
                  <p className="text-[11px] font-mono text-amber-700 dark:text-amber-400">
                    Cost of default ($10K) &gt;&gt; Cost of denial ($100)
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 — Class Imbalance */}
            <div className="rounded-2xl border border-violet-100 dark:border-violet-400/10 bg-violet-50/60 dark:bg-violet-400/5 p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-400/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-violet-500" />
                </div>
                <h4 className="font-bold text-on-surface text-sm leading-tight">Class Imbalance Challenge</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-xs font-bold text-violet-500 shrink-0">!</span>
                  <p className="text-xs text-on-surface-variant">Only <span className="font-semibold text-on-surface">7.7%</span> of customers actually default — heavily skewed dataset</p>
                </div>
                <div className="mt-3 px-3 py-2 rounded-lg bg-violet-100/80 dark:bg-violet-400/10 border border-violet-200/60 dark:border-violet-400/10">
                  <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1">Solution</p>
                  <p className="text-[11px] text-on-surface-variant">Stratified validation + F1-score optimisation</p>
                </div>
              </div>
            </div>

            {/* Card 3 — Model Drift */}
            <div className="rounded-2xl border border-sky-100 dark:border-sky-400/10 bg-sky-50/60 dark:bg-sky-400/5 p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-400/10 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5 text-sky-500" />
                </div>
                <h4 className="font-bold text-on-surface text-sm leading-tight">Model Drift Over Time</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-xs font-bold text-sky-500 shrink-0">~</span>
                  <p className="text-xs text-on-surface-variant">Credit patterns shift as the economy evolves — static models degrade</p>
                </div>
                <div className="mt-3 px-3 py-2 rounded-lg bg-sky-100/80 dark:bg-sky-400/10 border border-sky-200/60 dark:border-sky-400/10">
                  <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1">Solution</p>
                  <p className="text-[11px] text-on-surface-variant">Quarterly retraining + continuous performance monitoring</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Methodology Section */}
        <section className="p-10 rounded-2xl border border-slate-100 shadow-sm bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-2xl font-bold text-on-surface tracking-tight">Methodology Summary</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Three open-source credit datasets are standardized into a unified schema and fed through
                an XGBoost pipeline with domain-specific feature engineering, threshold-calibrated for
                maximum default recall.
              </p>
              <ul className="space-y-4 mt-6">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-on-surface font-semibold">Multi-Source Data: 3 datasets merged — Home Credit, Give Me Some Credit, UCI German Credit.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-on-surface font-semibold">Feature Engineering: 15 raw inputs + 9 derived features = 24 total features per transaction.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-on-surface font-semibold">Validation: 10-fold stratified cross-validation with recall-constrained threshold optimisation (≥75%).</span>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-3 grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-primary tracking-wider uppercase font-mono">1. Multi-Source Ingestion</span>
                <p className="text-[11px] text-on-surface-variant">3 Kaggle/UCI datasets schema-mapped into a unified 15-field credit risk API format.</p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-primary tracking-wider uppercase font-mono">2. Pre-processing</span>
                <p className="text-[11px] text-on-surface-variant">Label encoding, one-hot encoding, StandardScaler normalisation, IQR outlier removal, SMOTE oversampling.</p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-primary tracking-wider uppercase font-mono">3. XGBoost Inference</span>
                <p className="text-[11px] text-on-surface-variant">Single XGBoost model (depth-6, 200 estimators, scale_pos_weight) with threshold tuned to ≥75% recall.</p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-primary tracking-wider uppercase font-mono">4. SHAP Decision Engine</span>
                <p className="text-[11px] text-on-surface-variant">SHAP TreeExplainer surfaces top risk drivers per applicant; risk banded into Low / Medium / High.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Data Science Team */}
        <div id="team-section" className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Data Science Team */}
          <section className="space-y-6">
            <h3 className="text-2xl font-bold text-on-surface tracking-tight">Data Science Team</h3>
            <div className="p-8 rounded-2xl border border-slate-100 shadow-sm bg-white space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-slate-200 p-[1px] bg-white flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 shrink-0">
                    <span className="text-white text-sm font-bold">SB</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface text-sm">Dr. Suchandra Banerjee</h4>
                    <p className="text-xs text-on-surface-variant">Project Mentor, CSE(Data Science)</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-[#0077B5] hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:scale-105 active:scale-95 transition-all bg-white shadow-sm">
                      <Linkedin className="w-4 h-4" />
                    </a>
                    <a href="https://mail.google.com/mail/?view=cm&fs=1&to=suchandra.banerjee@bcrec.ac.in" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all bg-white shadow-sm">
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 p-[1px] bg-white">
                    <img
                      alt="Abhishek Gupta"
                      className="w-full h-full object-cover object-top rounded-full"
                      src={abhishekPhoto}
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface text-sm">Abhishek Gupta</h4>
                    <p className="text-xs text-on-surface-variant">Team Member, CSE(Data Science)</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <a href="https://www.linkedin.com/in/abhishek8853" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-[#0077B5] hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:scale-105 active:scale-95 transition-all bg-white shadow-sm">
                      <Linkedin className="w-4 h-4" />
                    </a>
                    <a href="https://mail.google.com/mail/?view=cm&fs=1&to=abhishekgupta20official@gmail.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all bg-white shadow-sm">
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Ranit Mondal */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 p-[1px] bg-white">
                    <img
                      alt="Ranit Mondal"
                      className="w-full h-full object-cover rounded-full"
                      src={ranitPhoto}
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface text-sm">Ranit Mondal</h4>
                    <p className="text-xs text-on-surface-variant">Team Member, CSE(Data Science)</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <a href="https://www.linkedin.com/in/ranitmmondal/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-[#0077B5] hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:scale-105 active:scale-95 transition-all bg-white shadow-sm">
                      <Linkedin className="w-4 h-4" />
                    </a>
                    <a href="https://mail.google.com/mail/?view=cm&fs=1&to=ranitmondal197@gmail.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all bg-white shadow-sm">
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Pratham Kumar */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 p-[1px] bg-white">
                    <img
                      alt="Pratham Kumar"
                      className="w-full h-full object-cover rounded-full"
                      src={prathamPhoto}
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface text-sm">Pratham Kumar</h4>
                    <p className="text-xs text-on-surface-variant">Team Member, CSE(Data Science)</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <a href="https://www.linkedin.com/in/pratham-kumar-133357229" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-[#0077B5] hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:scale-105 active:scale-95 transition-all bg-white shadow-sm">
                      <Linkedin className="w-4 h-4" />
                    </a>
                    <a href="https://mail.google.com/mail/?view=cm&fs=1&to=prathamkumar2740@gmail.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all bg-white shadow-sm">
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Whitepaper Modal */}
      {whitepaperOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => { if (e.target === e.currentTarget) setWhitepaperOpen(false); }}
        >
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-surface border border-slate-100 dark:border-white/10 shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-white/10 bg-surface/95 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface">RiskLens — Project Whitepaper</h2>
                  <p className="text-[11px] text-on-surface-variant">AI-Powered Credit Risk Assessment System · v1.0</p>
                </div>
              </div>
              <button
                onClick={() => setWhitepaperOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6 space-y-8">

              {/* Abstract */}
              <section className="space-y-2">
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Abstract</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  RiskLens is a production-grade, explainable AI credit risk engine built on the Home Credit Default Risk dataset
                  (307,511 loan applications). It uses an <span className="font-semibold text-on-surface">XGBoost</span> classifier
                  trained on 24 features (15 raw inputs + 9 domain-engineered features), achieving an AUC-ROC of{' '}
                  <span className="font-semibold text-on-surface">0.89</span> against a traditional baseline of 0.70.
                  The system delivers <span className="font-semibold text-on-surface">50ms</span> p99 inference latency
                  with full SHAP-based explainability, satisfying regulatory transparency requirements.
                  Automated fairness monitoring enforces a disparate-impact ratio above 0.80 across all protected demographic groups.
                </p>
              </section>

              <hr className="border-slate-100 dark:border-white/5" />

              {/* Key Metrics */}
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Key Performance Metrics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'AUC-ROC', value: '0.89', sub: 'vs 0.70 baseline' },
                    { label: 'Accuracy', value: '87.7%', sub: 'hold-out test set' },
                    { label: 'Recall', value: '75%', sub: 'default detection' },
                    { label: 'Latency', value: '50ms', sub: 'p99 inference' },
                  ].map((m) => (
                    <div key={m.label} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                      <p className="text-xl font-bold text-primary">{m.value}</p>
                      <p className="text-xs font-semibold text-on-surface mt-0.5">{m.label}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">{m.sub}</p>
                    </div>
                  ))}
                </div>
              </section>

              <hr className="border-slate-100 dark:border-white/5" />

              {/* Dataset */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Dataset Overview</h3>
                </div>
                <ul className="space-y-2">
                  {[
                    'Sources: Kaggle Home Credit Default Risk · Kaggle Give Me Some Credit · UCI German Credit Dataset',
                    '15 raw input features mapped from the dataset (demographics, financials, employment, history)',
                    '9 domain-engineered features: loan-to-income ratio, assets-to-loan ratio, debt-to-assets ratio, income per dependent, employment stability, credit×age interaction, high-DTI flag, subprime flag, prior-default flag',
                    'Total: 24 features fed into the model after label encoding + StandardScaler normalisation',
                    'Class imbalance: 7.7% default rate — handled via stratified K-Fold & class-weight balancing (scale_pos_weight)',
                    'Train/val/test split: 70/15/15 with random seed 42',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs text-on-surface-variant">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <hr className="border-slate-100 dark:border-white/5" />

              {/* Model Architecture */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Model Architecture</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-white dark:bg-white/[0.03]">
                    <p className="text-xs font-bold text-primary">XGBoost Classifier</p>
                    <p className="text-xs font-semibold text-on-surface mt-1">Sole production model</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">AUC 0.8952 · depth-6 · 200 estimators · lr 0.05 · early stopping · scale_pos_weight for class imbalance</p>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant">
                  Hyperparameters selected via <span className="font-semibold text-on-surface">Optuna</span> (200 trials, 5-fold stratified CV).
                  SHAP <code className="text-[10px] bg-slate-100 dark:bg-white/10 px-1 rounded">TreeExplainer</code> runs post-inference in ~5ms per prediction to surface the top feature drivers.
                </p>
              </section>

              <hr className="border-slate-100 dark:border-white/5" />

              {/* Explainability & Ethics */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Explainability &amp; Ethics</h3>
                </div>
                <ul className="space-y-2">
                  {[
                    'SHAP TreeExplainer computes per-prediction feature attributions in ~5ms — top drivers surfaced in the UI',
                    'Automated fairness audit at every deployment: demographic parity & equalised odds measured across gender, age band, and region',
                    'Disparate impact ratio enforced above 0.80 — deployment blocked if threshold is breached',
                    'Precision/recall threshold set to maximise F1 on the minority class (defaulters) rather than overall accuracy',
                    'Full audit trail: every prediction stored with a feature-value snapshot and SHAP vector for regulatory review',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs text-on-surface-variant">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <hr className="border-slate-100 dark:border-white/5" />

              {/* Footer links */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="https://github.com/layzabhi/credit_risk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <Github className="w-3.5 h-3.5" /> View Source Code
                </a>
                <span className="text-slate-200 dark:text-white/10">|</span>
                <span className="text-xs text-on-surface-variant">MIT License · © 2026 RiskLens · Abhishek (layzabhi)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AboutProjectPage;
