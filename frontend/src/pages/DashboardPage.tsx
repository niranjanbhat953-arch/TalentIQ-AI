import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  PlayCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Upload,
  ArrowRight,
  TrendingUp,
  Loader2,
  Users
} from 'lucide-react';
import { api } from '../lib/api';
import { AnalyticsData } from '../types';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboardAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load pipeline metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading pipeline analytics...</p>
      </div>
    );
  }

  const hasData = (data?.totalJobs || 0) > 0 || (data?.totalResumes || 0) > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Recruitment Intelligence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time pipeline overview derived directly from verified database records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/jobs/new"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-850 border border-slate-700/80 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-brand-400" />
            <span>Create Job</span>
          </Link>
          <Link
            to="/resumes/upload"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-600/25 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Resumes</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={loadDashboard} className="underline text-rose-300 font-semibold">Retry</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Job Profiles</span>
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-white">{data?.totalJobs || 0}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Defined role criteria versions</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Resumes Processed</span>
            <div className="p-2 rounded-lg bg-accent-cyan/10 text-accent-cyan">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-white">{data?.totalResumes || 0}</span>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span className="text-emerald-400 flex items-center gap-0.5 font-medium">
                <CheckCircle2 className="w-3 h-3" /> {data?.parsingSuccessCount || 0} extracted
              </span>
              {(data?.parsingFailedCount || 0) > 0 && (
                <span className="text-rose-400">({data?.parsingFailedCount} failed)</span>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Screening Runs</span>
            <div className="p-2 rounded-lg bg-accent-violet/10 text-accent-violet">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-white">{data?.totalScreeningRuns || 0}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Historical deterministic runs</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Awaiting Recruiter Review</span>
            <div className="p-2 rounded-lg bg-accent-amber/10 text-accent-amber">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-white">{data?.candidatesAwaitingReview || 0}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Unreviewed scorecards</p>
          </div>
        </div>
      </div>

      {/* Quick Action Pathways */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/jobs"
          className="group glass-card p-6 rounded-2xl hover:border-brand-500/50 transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 group-hover:scale-110 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Manage Job Criteria</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Define evaluation weights, responsibilities, required skills, and preview criteria versions.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-400 pt-4 group-hover:translate-x-1 transition-transform">
            <span>View Job Postings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/candidates"
          className="group glass-card p-6 rounded-2xl hover:border-accent-cyan/50 transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center text-accent-cyan group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Candidate Scorecards</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore explainable alignment scores, traceable evidence snippets, and recruiter review controls.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-accent-cyan pt-4 group-hover:translate-x-1 transition-transform">
            <span>Review Candidates</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/analytics"
          className="group glass-card p-6 rounded-2xl hover:border-accent-violet/50 transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-accent-violet/10 flex items-center justify-center text-accent-violet group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Pipeline Analytics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inspect real score distributions, skill demand trends, and parser reliability across screening runs.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-accent-violet pt-4 group-hover:translate-x-1 transition-transform">
            <span>Open Analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      {/* Recent Screening Activity */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Recent Screening Runs</h2>
          <Link to="/history" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
            View All History →
          </Link>
        </div>

        {data?.recentScreenings && data.recentScreenings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Job Title</th>
                  <th className="py-3 px-4">Resumes Screened</th>
                  <th className="py-3 px-4">Run Status</th>
                  <th className="py-3 px-4">Started At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.recentScreenings.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{run.jobTitle}</td>
                    <td className="py-3.5 px-4 text-slate-300">{run.totalProcessed} candidates</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {run.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{run.startedAt ? run.startedAt.slice(0, 16).replace('T', ' ') : 'Recently'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/candidates?jobId=${run.id}`}
                        className="text-brand-400 hover:text-brand-300 font-medium"
                      >
                        Inspect Results
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mx-auto text-slate-500">
              <PlayCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No Screening Runs Yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create a job posting and upload resumes to start your first explainable screening run.
            </p>
            <div className="pt-2">
              <Link
                to="/jobs/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500"
              >
                <span>Create Your First Job</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
