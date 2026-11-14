import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  CheckCircle2,
  XCircle,
  Briefcase,
  Users,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';
import { AnalyticsData } from '../types';

const COLORS = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6'];

export const AnalyticsDashboardPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboardAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load pipeline analytics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  // Transform score distribution for Recharts
  const scoreData = data?.scoreDistribution
    ? Object.entries(data.scoreDistribution).map(([range, count]) => ({
        range,
        count,
      }))
    : [];

  // Transform review status for Recharts
  const reviewData = data?.reviewStatusCounts
    ? Object.entries(data.reviewStatusCounts)
        .filter(([_, count]) => count > 0)
        .map(([status, count]) => ({
          name: status.replace('_', ' '),
          value: count,
        }))
    : [];

  const skillsData = data?.topSkillsDemanded || [];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Recruitment Pipeline Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Aggregated performance, score distribution, and parser health derived from stored candidate records.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400">Total Resumes Processed</span>
          <p className="text-3xl font-black text-white">{data?.totalResumes || 0}</p>
          <div className="flex items-center gap-2 text-[11px] pt-1">
            <span className="text-emerald-400 font-semibold">{data?.parsingSuccessCount || 0} parsed</span>
            <span className="text-slate-500">•</span>
            <span className="text-rose-400 font-semibold">{data?.parsingFailedCount || 0} failed</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400">Total Screening Runs</span>
          <p className="text-3xl font-black text-brand-400">{data?.totalScreeningRuns || 0}</p>
          <p className="text-[11px] text-slate-400 pt-1">Frozen audit snapshots</p>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400">Awaiting Recruiter Review</span>
          <p className="text-3xl font-black text-amber-400">{data?.candidatesAwaitingReview || 0}</p>
          <p className="text-[11px] text-slate-400 pt-1">Unprocessed scorecards</p>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400">Target Roles Configured</span>
          <p className="text-3xl font-black text-accent-cyan">{data?.totalJobs || 0}</p>
          <p className="text-[11px] text-slate-400 pt-1">Active criteria definitions</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alignment Score Distribution */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-400" />
            <span>Alignment Score Distribution</span>
          </h2>
          <p className="text-xs text-slate-400">
            Frequency of candidate overall scores grouped into 20-point score intervals.
          </p>

          <div className="h-64 w-full pt-4">
            {scoreData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="range" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
                No screened candidates to plot score distribution.
              </div>
            )}
          </div>
        </div>

        {/* Review Status Breakdown */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-accent-cyan" />
            <span>Recruiter Review Pipeline Status</span>
          </h2>
          <p className="text-xs text-slate-400">
            Breakdown of candidates across human review states.
          </p>

          <div className="h-64 w-full pt-4">
            {reviewData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reviewData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {reviewData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
                No candidate review statuses recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Skills Demanded */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Most Frequently Required Skills Across Configured Roles</span>
        </h2>
        <p className="text-xs text-slate-400">
          Core competencies weighted highest across active job profiles.
        </p>

        {skillsData.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {skillsData.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between"
              >
                <span className="text-xs font-semibold text-white truncate pr-2">{item.skill}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                  {item.count} {item.count === 1 ? 'role' : 'roles'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic py-4">No skills registered in job profiles yet.</p>
        )}
      </div>
    </div>
  );
};
