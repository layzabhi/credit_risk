import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LandingPage() {
  const navigate = useRef(useNavigate()).current;
  const { isAuthenticated } = useAuth();
  const containerRef = useRef(null);

  // Setup scroll intersection observer for entrance animations
  useEffect(() => {
    const sections = containerRef.current?.querySelectorAll('section');
    if (!sections) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
          }
        });
      },
      { threshold: 0.1 }
    );

    sections.forEach((section) => {
      section.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10');
      observer.observe(section);
    });

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const handleAction = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleRegisterAction = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="landing-page-root" ref={containerRef}>
      {/* Scoped CSS variables to match Stitch design and prevent polluting internal dashboard UI */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .landing-page-root {
          --primary: #3525cd;
          --primary-container: #4f46e5;
          --on-primary: #ffffff;
          --background: #f8f9ff;
          --on-background: #0b1c30;
          --surface: #f8f9ff;
          --on-surface: #0b1c30;
          --on-surface-variant: #464555;
          --surface-container-lowest: #ffffff;
          --surface-container-highest: #d3e4fe;
          --outline: #777587;
          --outline-variant: #c7c4d8;
          --tertiary: #005338;
          --tertiary-fixed-dim: #4edea3;
          --inverse-surface: #213145;
          --inverse-on-surface: #eaf1ff;
          --secondary-fixed-dim: #bec6e0;
          --primary-fixed-dim: #c3c0ff;
          --error-container: #ffdad6;
          --surface-container: #e5eeff;
          --primary-fixed: #e2dfff;
          
          background-color: var(--background);
          color: var(--on-background);
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .landing-page-root nav {
          background-color: rgba(248, 249, 255, 0.8);
          border-color: rgba(199, 196, 216, 0.3);
        }

        .landing-page-root .text-primary { color: var(--primary); }
        .landing-page-root .text-on-surface { color: var(--on-surface); }
        .landing-page-root .text-on-surface-variant { color: var(--on-surface-variant); }
        .landing-page-root .text-tertiary { color: var(--tertiary); }
        .landing-page-root .text-inverse-on-surface { color: var(--inverse-on-surface); }
        .landing-page-root .text-secondary-fixed-dim { color: var(--secondary-fixed-dim); }
        .landing-page-root .text-tertiary-fixed-dim { color: var(--tertiary-fixed-dim); }
        .landing-page-root .text-primary-fixed-dim { color: var(--primary-fixed-dim); }
        .landing-page-root .text-error-container { color: var(--error-container); }
        .landing-page-root .text-on-primary { color: var(--on-primary); }

        .landing-page-root .bg-background { background-color: var(--background); }
        .landing-page-root .bg-surface-container-lowest { background-color: var(--surface-container-lowest); }
        .landing-page-root .bg-surface-container-highest { background-color: var(--surface-container-highest); }
        .landing-page-root .bg-primary-container { background-color: var(--primary-container); }
        .landing-page-root .bg-surface-container { background-color: var(--surface-container); }
        .landing-page-root .bg-primary-fixed\/20 { background-color: rgba(226, 223, 255, 0.2); }
        .landing-page-root .bg-tertiary-fixed-dim { background-color: var(--tertiary-fixed-dim); }
        .landing-page-root .bg-inverse-surface { background-color: var(--inverse-surface); }
        .landing-page-root .bg-surface-container-lowest\/5 { background-color: rgba(255, 255, 255, 0.05); }
        .landing-page-root .bg-black\/20 { background-color: rgba(0, 0, 0, 0.2); }
        .landing-page-root .bg-black\/40 { background-color: rgba(0, 0, 0, 0.4); }

        .landing-page-root .border-outline-variant\/30 { border-color: rgba(199, 196, 216, 0.3); }
        .landing-page-root .border-outline-variant\/20 { border-color: rgba(199, 196, 216, 0.2); }
        .landing-page-root .border-outline { border-color: var(--outline); }
        .landing-page-root .border-white\/10 { border-color: rgba(255, 255, 255, 0.1); }
        .landing-page-root .border-white\/20 { border-color: rgba(255, 255, 255, 0.2); }

        .landing-page-root .hover\:bg-primary:hover { background-color: var(--primary); }
        .landing-page-root .hover\:bg-surface-container:hover { background-color: var(--surface-container); }
        .landing-page-root .hover\:bg-surface-container-highest:hover { background-color: var(--surface-container-highest); }

        .landing-glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .landing-page-root .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        .landing-bento-card-hover {
          transition: all 0.3s ease;
        }
        .landing-bento-card-hover:hover {
          transform: scale(1.01);
          border-color: rgba(255, 255, 255, 0.2);
        }
      ` }} />

      {/* Top Navigation */}
      <nav className="fixed top-0 w-full bg-[#f8f9ff]/90 backdrop-blur-md z-50 border-b border-[#c7c4d8]/30">
        <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-h4 font-h4 font-bold text-primary">RiskLens</span>
          </div>
          <div className="hidden md:flex gap-6 items-center">
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#features">
              Features
            </a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#solutions">
              Solutions
            </a>
            <button
              onClick={handleAction}
              className="bg-primary-container text-on-primary px-6 py-2 rounded-lg font-label-md text-label-md hover:bg-primary transition-all shadow-sm cursor-pointer"
            >
              Get Started
            </button>
          </div>
          <button className="md:hidden text-on-surface" onClick={handleAction}>
            <span className="material-symbols-outlined">login</span>
          </button>
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 px-4 lg:py-16">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="z-10">
              <h1 className="font-h1 text-h1-mobile lg:text-h1 mb-6 text-on-surface leading-tight">
                AI-Powered Credit Risk Assessment &amp; Scoring System
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-12 max-w-xl">
                Leverage machine learning and alternative data to predict creditworthiness with surgical accuracy. RiskLens delivers actionable insights in milliseconds.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleRegisterAction}
                  className="bg-primary-container text-on-primary px-8 py-4 rounded-lg font-h4 text-h4 hover:scale-[1.02] transition-transform shadow-lg cursor-pointer font-semibold"
                >
                  Get Started
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('features');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="border border-outline text-on-surface px-8 py-4 rounded-lg font-h4 text-h4 hover:bg-surface-container transition-colors cursor-pointer font-semibold"
                >
                  Learn more
                </button>
              </div>
            </div>

            <div className="relative min-h-[400px] lg:min-h-[500px]">
              <div className="absolute inset-0 bg-primary-fixed/20 rounded-3xl blur-3xl"></div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
                <div className="landing-glass-card p-8 rounded-2xl shadow-2xl relative">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col">
                      <span className="font-h4 text-h4 text-primary">Live Assessment</span>
                      <span className="flex items-center gap-1 text-tertiary font-label-sm text-label-sm animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span> Scanning Applicant Data...
                      </span>
                    </div>
                  </div>
                  <div className="space-y-6 mb-8">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-label-sm text-label-sm">
                        <span className="text-on-surface-variant">Identity Verification</span>
                        <span className="flex items-center gap-1 text-tertiary font-bold">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span> 100%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-tertiary-fixed-dim w-full"></div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-label-sm text-label-sm">
                        <span className="text-on-surface-variant">Risk Engine Processing</span>
                        <span className="text-primary font-bold">42%</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-primary-container w-[42%] animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-outline-variant/30">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase opacity-60">Model Confidence</span>
                      <p className="font-h4 text-h4 text-primary">94.2%</p>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase opacity-60">Processing Speed</span>
                      <p className="font-h4 text-h4 text-on-surface font-semibold">18ms</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 px-4" id="features">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-h2 text-h2 mb-4 text-on-surface leading-snug">Engineered for Intelligence</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
                Our platform combines traditional financial metrics with advanced behavioral patterns to reveal the true risk profile of every applicant.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/30 hover:border-primary transition-all group">
                <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center mb-8 group-hover:bg-primary-container group-hover:text-on-primary transition-colors text-primary">
                  <span className="material-symbols-outlined">bolt</span>
                </div>
                <h3 className="font-h4 text-h4 mb-4 text-on-surface">Real-time Scoring</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Instant risk evaluations using millions of data points processed in under 200ms for a seamless applicant experience.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/30 hover:border-primary transition-all group">
                <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center mb-8 group-hover:bg-primary-container group-hover:text-on-primary transition-colors text-primary">
                  <span className="material-symbols-outlined">visibility</span>
                </div>
                <h3 className="font-h4 text-h4 mb-4 text-on-surface">SHAP Explainability</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Don't just get a score—understand why. Our models provide clear reasoning for every decision, ensuring full regulatory compliance.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/30 hover:border-primary transition-all group">
                <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center mb-8 group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtHWtj7EzqMpXLmfddldg5ecKeSgyFT-8VdmupeuEFgjfl3a-EU_5a7zXF-nkMtV-RcWhOYPacUTAVRZ3dwXfah8MgvRQAHjPj4jX2YwswyZvveAVMGxIByQklM686w4fJGuVqprrEU-plxiNdwxdlVnHl-iaIrYH9N-9Z4_RXimYF1Or0VupSfl8AZDpc-1sb51CM36jmtj5TElTuEcM-XBzkt1Kn8yO1325FgT90XoDrWcyiGXUe-KUCtVCST9K-Q-5D9ELXHpo"
                    alt="Model Performance Logo"
                    className="w-8 h-auto object-contain grayscale group-hover:grayscale-0 transition-all"
                  />
                </div>
                <h3 className="font-h4 text-h4 mb-2 text-on-surface">Model Performance</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  XGBoost achieved the highest AUC-ROC of 89.52% and F1-Score of 48.35% with Recall of 75.01% while maintaining the highest precision of 35.67%, meaning it flags defaults with the fewest false alarms.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Data & Analytics Section */}
        <section className="py-16 bg-inverse-surface text-inverse-on-surface">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-4">
                <h2 className="font-h2 text-h2 mb-6 text-white">Visualizing Risk Intelligence</h2>
                <p className="font-body-md text-body-md text-secondary-fixed-dim mb-8">
                  Our assessment engine provides a bird's-eye view of your entire portfolio's health. Monitor trends, identify outliers, and adjust your risk appetite in real-time.
                </p>
                <div className="space-y-6 text-white">
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-tertiary-fixed-dim">check_circle</span>
                    <div>
                      <p className="font-label-md text-label-md font-bold">ML Risk Engine</p>
                      <p className="font-body-sm text-body-sm opacity-70 mt-1">XGBoost model optimized for credit assessment using 24+ core applicant features.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-tertiary-fixed-dim">check_circle</span>
                    <div>
                      <p className="font-label-md text-label-md font-bold">Drill-down Analytics</p>
                      <p className="font-body-sm text-body-sm opacity-70 mt-1">Analyze individual decision drivers and demographic correlations.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-8 grid md:grid-cols-2 gap-8 text-white">
                {/* Portfolio Risk Share */}
                <div className="bg-surface-container-lowest/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 landing-bento-card-hover">
                  <div className="flex items-center gap-1 mb-4">
                    <span className="material-symbols-outlined text-primary-fixed-dim">monitoring</span>
                    <h4 className="font-h4 text-h4">Portfolio Risk Share</h4>
                  </div>
                  <p className="font-body-sm text-body-sm text-secondary-fixed-dim mb-8">Relative distribution of credit risk ratings.</p>
                  <div className="relative w-48 h-48 mx-auto mb-8">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle className="transition-all duration-1000" cx="50" cy="50" fill="transparent" r="40" stroke="#10b981" strokeDasharray="251.2" strokeDashoffset="168" strokeWidth="12"></circle>
                      <circle className="transition-all duration-1000" cx="50" cy="50" fill="transparent" r="40" stroke="#f59e0b" strokeDasharray="251.2" strokeDashoffset="84" strokeWidth="12"></circle>
                      <circle className="transition-all duration-1000" cx="50" cy="50" fill="transparent" r="40" stroke="#ef4444" strokeDasharray="251.2" strokeDashoffset="201" strokeWidth="12"></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="font-label-sm text-label-sm opacity-60 uppercase tracking-wide">MODEL</span>
                      <span className="font-label-md text-label-md font-bold text-primary-fixed-dim">XGBoost</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-black/20 p-2 rounded-xl text-center">
                    <div>
                      <p className="font-label-sm text-label-sm opacity-60 uppercase">Low</p>
                      <p className="text-tertiary-fixed-dim font-bold text-sm">Low</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm opacity-60 uppercase">Med</p>
                      <p className="text-secondary-fixed-dim font-bold text-sm">Med</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm opacity-60 uppercase">High</p>
                      <p className="text-error-container font-bold text-sm">High</p>
                    </div>
                  </div>
                </div>

                {/* Credit Assessment Trends */}
                <div className="bg-surface-container-lowest/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 landing-bento-card-hover">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-tertiary-fixed-dim">trending_up</span>
                        <h4 className="font-h4 text-h4">Credit Trends</h4>
                      </div>
                      <p className="font-body-sm text-body-sm text-secondary-fixed-dim mt-1">Assessment volume patterns (7d)</p>
                    </div>
                    <div className="flex bg-black/40 p-2 rounded-lg">
                      <span className="px-3 py-1 rounded bg-primary-container text-white text-[10px] font-bold">Area</span>
                    </div>
                  </div>
                  <div className="h-48 relative mt-8">
                    <svg className="w-full h-full" viewBox="0 0 400 200">
                      <defs>
                        <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.2 }} />
                          <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0 }} />
                        </linearGradient>
                      </defs>
                      <path className="trend-line" d="M0 200 Q 50 180, 100 150 T 200 190 T 300 100 T 400 200" fill="url(#grad1)" stroke="#10b981" strokeWidth="2" />
                      <path className="opacity-50" d="M0 200 Q 100 100, 200 50 T 300 180 T 400 200" fill="transparent" stroke="#f59e0b" strokeDasharray="4" strokeWidth="2" />
                    </svg>
                    <div className="absolute bottom-0 left-0 w-full flex justify-between px-2 text-[10px] opacity-40">
                      <span>JUN 10</span>
                      <span>JUN 12</span>
                      <span>JUN 14</span>
                      <span>JUN 16</span>
                    </div>
                  </div>
                  <div className="flex justify-center gap-6 mt-8 text-[10px] font-bold">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span> LOW RISK
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim"></span> MED RISK
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Integration Section */}
        <section className="py-16 px-4 max-w-7xl mx-auto overflow-hidden" id="solutions">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <img
                alt="Integration Dashboard"
                className="rounded-2xl shadow-2xl border border-outline-variant/30 w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA51e7Yh8g7X1WVNu_4UmZECcqgdSCegR4z7iVm9PAuM67uUvU_Hm5qK3Kdptk1KYpuPJZe7Mia3GoKvszXxBTtoBFVymtwAXD-9uPOtHJMODisTpgmw5HE4-cghH0_cP_lBRCmerLw-TRUeSehdKsUNsAgUo2vn2PnjSaD5uBXoAjc6vCbIhcUpCe1dduMUotnQ-HDluV9FyFc2aHrbSOvzOXslv6iXYB7FaKXsF_E3p3ZGkRxRCKM43HsQ7z0hCaTc2J0Dyb6LPA"
              />
              <div className="absolute -bottom-6 -right-6 bg-surface-container-lowest p-6 rounded-2xl shadow-xl border border-outline-variant/50 hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary">
                    <span className="material-symbols-outlined">bolt</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md font-bold text-on-surface">Model Latency</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Response time: &lt; 100ms</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="font-h2 text-h2 mb-6 text-on-surface leading-tight">End-to-End Decision Pipeline</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-8">
                RiskLens integrates predictive machine learning and explainability into a unified pipeline. Instantly evaluate individual applicants and inspect critical risk indicators.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4 text-on-surface font-label-md">
                  <span className="material-symbols-outlined text-primary">fact_check</span> Interactive Risk Assessment &amp; Scoring
                </li>
                <li className="flex items-center gap-4 text-on-surface font-label-md">
                  <span className="material-symbols-outlined text-primary">insights</span> Detailed SHAP Feature Explanations
                </li>
                <li className="flex items-center gap-4 text-on-surface font-label-md">
                  <span className="material-symbols-outlined text-primary">history</span> Application Tracking &amp; Historic Logs
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto bg-primary-container rounded-3xl p-12 md:p-16 text-center relative overflow-hidden shadow-xl">
            <div className="relative z-10">
              <h2 className="font-h1 text-h1-mobile lg:text-h1 text-on-primary mb-6 leading-tight">
                Ready to refine your risk engine?
              </h2>
              <p className="font-body-lg text-body-lg text-on-primary/80 mb-12 max-w-2xl mx-auto">
                Join RiskLens to drive more accurate lending decisions and lower default rates.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleRegisterAction}
                  className="bg-white text-primary px-8 py-4 rounded-xl font-h4 text-h4 shadow-xl hover:bg-surface-container-highest transition-colors font-semibold cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-inverse-surface py-16 mt-12 border-t border-outline-variant/10 text-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="col-span-2 md:col-span-1">
            <span className="text-h3 font-h3 font-bold text-white">RiskLens</span>
            <p className="mt-4 text-secondary-fixed-dim font-body-sm text-body-sm leading-relaxed">
              The next generation of credit risk intelligence for banks, fintechs, and credit unions.
            </p>
          </div>
          <div>
            <h4 className="font-label-md text-label-md font-bold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-secondary-fixed-dim hover:text-primary-fixed-dim transition-colors font-body-sm text-body-sm">
                  Features
                </a>
              </li>
              <li>
                <a href="#solutions" className="text-secondary-fixed-dim hover:text-primary-fixed-dim transition-colors font-body-sm text-body-sm">
                  Solutions
                </a>
              </li>
              <li>
                <span className="text-secondary-fixed-dim font-body-sm text-body-sm opacity-50">
                  Pricing
                </span>
              </li>
              <li>
                <span className="text-secondary-fixed-dim font-body-sm text-body-sm opacity-50">
                  API Docs
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-label-md text-label-md font-bold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-secondary-fixed-dim font-body-sm text-body-sm opacity-50">
                  About Us
                </span>
              </li>
              <li>
                <span className="text-secondary-fixed-dim font-body-sm text-body-sm opacity-50">
                  Careers
                </span>
              </li>
              <li>
                <span className="text-secondary-fixed-dim font-body-sm text-body-sm opacity-50">
                  Contact
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-label-md text-label-md font-bold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-secondary-fixed-dim font-body-sm text-body-sm opacity-50">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-secondary-fixed-dim font-body-sm text-body-sm opacity-50">
                  Terms of Service
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-secondary-fixed-dim font-body-sm text-body-sm">© 2026 RiskLens AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
