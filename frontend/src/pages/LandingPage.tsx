import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  FileText,
  Target,
  ArrowRight,
  SlidersHorizontal,
  Lock,
  Search,
  Eye,
  Award,
  FileSearch
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-navy-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-cyan p-0.5 shadow-lg shadow-brand-500/20">
              <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-brand-400" />
              </div>
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              TalentIQ <span className="text-brand-400">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-brand-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand-400 transition-colors">How It Works</a>
            <a href="#responsible-ai" className="hover:text-brand-400 transition-colors">Responsible AI</a>
            <a href="#preview" className="hover:text-brand-400 transition-colors">Interface Preview</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/signin"
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signin"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 shadow-md shadow-brand-600/25 transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden border-b border-slate-800/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]" />
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Beyond Resumes. Discover Potential.</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Explainable, Evidence-Based <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-accent-cyan bg-clip-text text-transparent">
              Recruitment Intelligence
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            TalentIQ AI empowers recruiters with transparent candidate alignment scoring, 
            verifiable resume evidence extraction, and tailored interview assistance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/signin"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-xl shadow-brand-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Launch Recruiter Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#preview"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Demo Data</span>
            </a>
          </div>

          {/* Core Principles Pill */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Decision Support Only</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero Automatic Rejection</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Auditable Evidence Traceability</span>
            </div>
          </div>
        </div>
      </section>

      {/* Illustrative Interface Preview */}
      <section id="preview" className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-2 mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Production Interface</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Transparent Candidate Evaluation Dossier</h2>
          <p className="text-xs text-slate-400 italic">
            * Note: Candidate profiles and scores depicted below are illustrative sample data for demonstration.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white">Sarah Jenkins</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Shortlisted for Interview
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Evaluated for <span className="text-slate-200 font-medium">Lead Cloud Infrastructure Architect</span> • Criteria v2
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-xs text-slate-400">Alignment Score</span>
                <p className="text-2xl font-extrabold text-brand-400">92.5 <span className="text-xs text-slate-400 font-normal">/ 100</span></p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Evaluation Coverage</span>
                <p className="text-2xl font-extrabold text-accent-cyan">100%</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-xs text-slate-400">Required Skills (40%)</span>
              <p className="text-lg font-bold text-white">95.0%</p>
              <p className="text-[11px] text-emerald-400">Kubernetes, Python, AWS, Docker</p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-xs text-slate-400">Relevant Experience (25%)</span>
              <p className="text-lg font-bold text-white">90.0%</p>
              <p className="text-[11px] text-slate-300">6.2 yrs (Exceeds min 5.0 yrs)</p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-xs text-slate-400">Relevant Projects (20%)</span>
              <p className="text-lg font-bold text-white">95.0%</p>
              <p className="text-[11px] text-slate-300">Multi-region K8s deployment</p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-xs text-slate-400">Education & Certs (15%)</span>
              <p className="text-lg font-bold text-white">88.0%</p>
              <p className="text-[11px] text-slate-300">B.S. CS + AWS Solutions Architect</p>
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Eye className="w-4 h-4 text-brand-400" />
              <span>Traceable Evidence Snippet (Extracted Page 1)</span>
            </div>
            <p className="text-xs text-slate-400 font-mono bg-navy-950 p-3 rounded-lg border border-slate-800/80">
              "Architected multi-region Kubernetes clusters handling 40M daily requests. Reduced API p99 latency by 32% through PostgreSQL query indexing and Redis caching."
            </p>
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section id="features" className="py-16 px-6 bg-navy-900/30 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Core Capabilities</span>
            <h2 className="text-3xl font-bold text-white">Engineered for Human Decision Velocity</h2>
            <p className="text-sm text-slate-400">
              Every feature is built to assist recruiters with transparent data, explainable logic, and zero black-box obscurity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Dynamic Weight Renormalization</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When a candidate lacks unevaluable resume sections, weights are redistributed cleanly across evaluable criteria. Zero division-by-zero or deflated scores.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Traceable Skill-Gap Matrix</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Categorizes skills into Found, Partially Supported, Unclear, Not Detected, and Unevaluable with direct citation to resume text and page numbers.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent-violet/20 border border-accent-violet/30 flex items-center justify-center text-accent-violet">
                <FileSearch className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Interview Question Assistant</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generates competency-based technical, behavioral, and problem-solving interview questions directly linked to observed candidate projects and skill gaps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-6 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400">The Pipeline</span>
          <h2 className="text-3xl font-bold text-white">Four Steps to Explainable Shortlisting</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Create & Version Job',
              desc: 'Define responsibilities, required skills, and custom criteria weights. Every change increments criteria version.'
            },
            {
              step: '02',
              title: 'Bulk Resume Upload',
              desc: 'Upload PDF and DOCX files. PyMuPDF extracts readable text, detects scanned images, and flags SHA-256 duplicates.'
            },
            {
              step: '03',
              title: 'Evidence-Based Match',
              desc: 'Deterministic evaluation aligns candidate evidence with requirements, computing coverage and skill gap matrices.'
            },
            {
              step: '04',
              title: 'Recruiter Decision',
              desc: 'Inspect scorecard, review evidence, compare top candidates side-by-side, generate interview rubrics, and export CSV/PDF reports.'
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 space-y-3 relative">
              <span className="text-3xl font-black text-slate-700 font-mono">{item.step}</span>
              <h3 className="text-base font-bold text-white">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Responsible AI & Privacy */}
      <section id="responsible-ai" className="py-16 px-6 bg-navy-900/40 border-t border-slate-800/60">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Responsible AI & Data Privacy Commitment</h2>
              <p className="text-xs text-slate-400">Strict safeguards embedded in our system architecture.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
            <div className="space-y-2 bg-slate-900/60 p-5 rounded-xl border border-slate-800/80">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Protected Characteristics Ignored
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Candidate names, gender, age, photographs, physical addresses, nationality, and marital status never influence alignment scores.
              </p>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-5 rounded-xl border border-slate-800/80">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Missing Evidence Principle
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Missing resume evidence does not prove a candidate lacks a skill. The system labels unverified criteria as Not Detected or Unclear for recruiter verification.
              </p>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-5 rounded-xl border border-slate-800/80">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                Zero-Trust Server Authorization
              </h4>
              <p className="text-slate-400 leading-relaxed">
                All records enforce server-side resource ownership. Resumes are stored in private storage and never exposed via public URLs.
              </p>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-5 rounded-xl border border-slate-800/80">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Human Recruiter Supremacy
              </h4>
              <p className="text-slate-400 leading-relaxed">
                TalentIQ AI is a decision-support platform. The software never makes autonomous rejections or final hiring decisions without human review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-navy-950 py-8 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">TalentIQ AI</span>
            <span>• Beyond Resumes. Discover Potential.</span>
          </div>
          <p>© 2026 TalentIQ AI. All rights reserved. Decision Support Architecture.</p>
        </div>
      </footer>
    </div>
  );
};
