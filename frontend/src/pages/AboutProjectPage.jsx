import React from 'react';
import {
  Download,
  Mail,
  ShieldCheck,
  Eye,
  Scale,
  CheckCircle2,
  MessageSquare,
  User,
  Award,
  Clock,
  ExternalLink
} from 'lucide-react';

export function AboutProjectPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fadeIn">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full neo-inset text-xs font-bold text-primary tracking-wider uppercase bg-[#e8eaf0]">
            Project Documentation
          </div>
          <h1 className="text-4xl lg:text-5xl font-headline font-bold tracking-tight text-on-surface leading-tight">
            Pioneering <span className="text-primary">Reliable</span> Credit Risk Assessment.
          </h1>
          <p className="text-base lg:text-lg text-on-surface-variant leading-relaxed">
            RiskLens is an advanced neural-engine designed to harmonize financial prudence with modern data science. We provide transparent, high-precision credit scoring models that empower financial institutions while ensuring consumer fairness.
          </p>
          <div className="flex gap-4">
            <button className="px-6 py-3 rounded-xl neo-raised text-primary font-semibold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all bg-[#e8eaf0]">
              <Download className="w-4 h-4" />
              Whitepaper
            </button>
            <button className="px-6 py-3 rounded-xl neo-raised text-on-surface-variant font-semibold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all bg-[#e8eaf0]">
              <Mail className="w-4 h-4" />
              Contact Team
            </button>
          </div>
        </div>
        <div className="relative h-[360px] rounded-3xl overflow-hidden neo-raised p-2">
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
          <div className="p-8 rounded-3xl neo-raised bg-background flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl neo-inset flex items-center justify-center text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-on-surface">Integrity &amp; Accuracy</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Implementing state-of-the-art XGBoost and Neural Network architectures to maintain a 87.7% accuracy rate in probability-of-default predictions.
            </p>
          </div>
          <div className="p-8 rounded-3xl neo-raised bg-background flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl neo-inset flex items-center justify-center text-tertiary">
              <Eye className="w-6 h-6 text-tertiary" />
            </div>
            <h4 className="text-lg font-bold text-on-surface">Model Transparency</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Utilizing SHAP and LIME values to ensure every decision made by the system is explainable to stakeholders and regulatory bodies.
            </p>
          </div>
          <div className="p-8 rounded-3xl neo-raised bg-background flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl neo-inset flex items-center justify-center text-indigo-400">
              <Scale className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-on-surface">Ethical Lending</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Automated bias-detection loops that continuously monitor for demographic disparities and ensure fair lending across all socio-economic groups.
            </p>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="p-10 rounded-[2rem] neo-raised bg-background relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-2xl font-bold text-on-surface tracking-tight">Methodology Summary</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Our approach combines traditional Bayesian inference with modern deep learning to handle non-linear risk factors in real-time streaming data environments.
            </p>
            <ul className="space-y-4 mt-6">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-xs text-on-surface font-semibold">Feature Engineering: 240+ socio-economic data points processed per transaction.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-xs text-on-surface font-semibold">Validation: K-Fold cross-validation with temporal leakage protection.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-xs text-on-surface font-semibold">Infrastructure: Serverless GPU-accelerated inference pipelines.</span>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-3 grid grid-cols-2 gap-4">
            <div className="neo-inset p-6 rounded-2xl bg-[#e8eaf0] space-y-2">
              <span className="text-[10px] font-bold text-primary tracking-wider uppercase font-mono">1. Data Ingestion</span>
              <p className="text-[11px] text-on-surface-variant">Real-time ETL pipelines from Bureau APIs and internal ledgers.</p>
            </div>
            <div className="neo-inset p-6 rounded-2xl bg-[#e8eaf0] space-y-2">
              <span className="text-[10px] font-bold text-primary tracking-wider uppercase font-mono">2. Pre-processing</span>
              <p className="text-[11px] text-on-surface-variant">Automated handling of missing values and cyclical feature encoding.</p>
            </div>
            <div className="neo-inset p-6 rounded-2xl bg-[#e8eaf0] space-y-2">
              <span className="text-[10px] font-bold text-primary tracking-wider uppercase font-mono">3. Model Inference</span>
              <p className="text-[11px] text-on-surface-variant">Ensemble logic weighing XGBoost, LightGBM, and CatBoost models.</p>
            </div>
            <div className="neo-inset p-6 rounded-2xl bg-[#e8eaf0] space-y-2">
              <span className="text-[10px] font-bold text-primary tracking-wider uppercase font-mono">4. Decision Engine</span>
              <p className="text-[11px] text-on-surface-variant">Risk-adjusted pricing recommendations based on EL and LGD.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Version History & Contact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Version History */}
        <section className="space-y-6">
          <h3 className="text-2xl font-bold text-on-surface tracking-tight">Version History</h3>
          <div className="space-y-4">
            <div className="flex gap-6 items-start p-4 rounded-2xl hover:bg-[#e2e4ea] transition-colors group">
              <div className="text-primary font-bold text-xs min-w-[60px] pt-1 font-mono">v2.4.0</div>
              <div className="space-y-1">
                <p className="font-semibold text-on-surface text-sm flex items-center">
                  Real-time Bias Monitor
                  <span className="ml-2 text-[9px] px-2 py-0.5 rounded-full neo-inset text-on-surface-variant font-mono">LATEST</span>
                </p>
                <p className="text-xs text-on-surface-variant">Introduced Fairlearn integration for automated demographic parity checks.</p>
              </div>
            </div>
            <div className="flex gap-6 items-start p-4 rounded-2xl hover:bg-[#e2e4ea] transition-colors group">
              <div className="text-on-surface-variant/50 font-bold text-xs min-w-[60px] pt-1 font-mono">v2.3.1</div>
              <div className="space-y-1">
                <p className="font-semibold text-on-surface text-sm">SHAP Kernel Optimization</p>
                <p className="text-xs text-on-surface-variant">Increased explainability computation speed by 45% for complex loan applications.</p>
              </div>
            </div>
            <div className="flex gap-6 items-start p-4 rounded-2xl hover:bg-[#e2e4ea] transition-colors group">
              <div className="text-on-surface-variant/50 font-bold text-xs min-w-[60px] pt-1 font-mono">v2.2.0</div>
              <div className="space-y-1">
                <p className="font-semibold text-on-surface text-sm">Alternative Data Integration</p>
                <p className="text-xs text-on-surface-variant">Expansion of feature set to include utility and rental payment history records.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Data Science Team */}
        <section className="space-y-6">
          <h3 className="text-2xl font-bold text-on-surface tracking-tight">Data Science Team</h3>
          <div className="p-8 rounded-[2rem] neo-raised bg-background space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden neo-inset p-[1px] bg-[#e8eaf0]">
                  <img
                    alt="Sarah Chen"
                    className="w-full h-full object-cover rounded-full"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBigG8PYz-I_hjH8L4bOUOVbObavSi4xbfy_YRDkiUJfVJZb7czUPmRfGWWwTXTBAV5AIgLQRV3Y2l7rPMEu_ESD_xTwGJiXBByMqrhD5dPvEgNBkBwfutFDS7oxDoviurZbay_BKAhC2_axi2ed_CCtRFe-8SWi6MCEz9K1759A7Nk4gRna19vcD57lKsZONB9up_w_FDw4SpDVVokrTpEX4y8-ceN0VzxCA6gqxR1T7JzIuO74CrjrBFFv3UKcnRKnXuLh17YWXnK"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface text-sm">Dr. Sarah Chen</h4>
                  <p className="text-xs text-on-surface-variant">Chief Data Scientist — Research Lead</p>
                </div>
                <button className="ml-auto w-9 h-9 rounded-xl neo-raised flex items-center justify-center text-primary hover:scale-105 active:scale-95 transition-all bg-[#e8eaf0]">
                  <Mail className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden neo-inset p-[1px] bg-[#e8eaf0]">
                  <img
                    alt="James Wilson"
                    className="w-full h-full object-cover rounded-full"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzlUGft_YbqutcGMB0vOJc8nQCN-pCn7Vy26TZ_IsIf2MoGv0B9KP2WrVLV9ksvBgOwDsb7YymT2Z0QWP3nYLsgzYjotBiZpqngYkQ0QtbPzZAYFxZ0isR9rLw_aDAn3wVPBhEhy2q9FDc6sA9_lEcZub-XpO5Cv0v1nHSN2hj1hiASb3Fw45SqZJpHJdZuQpusB7n4t75nS8ai6MKZEhwNo7ZtgPe_HSVHJew72KbvMISlTDOiZVjZwpv0tHT2EFEig06dHS72J7n"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface text-sm">James Wilson</h4>
                  <p className="text-xs text-on-surface-variant">ML Engineer — Infrastructure</p>
                </div>
                <button className="ml-auto w-9 h-9 rounded-xl neo-raised flex items-center justify-center text-primary hover:scale-105 active:scale-95 transition-all bg-[#e8eaf0]">
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AboutProjectPage;
