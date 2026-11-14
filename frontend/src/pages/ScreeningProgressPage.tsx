import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Briefcase,
  Users,
  ShieldCheck,
  ArrowRight,
  Clock,
  Layers
} from 'lucide-react';
import { api } from '../lib/api';
import { Job, ScreeningRun } from '../types';

export const ScreeningProgressPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedJobId = searchParams.get('jobId');
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(preselectedJobId || '');
  const [startingRun, setStartingRun] = useState(false);
  const [completedRun, setCompletedRun] = useState<ScreeningRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await api.listJobs('ACTIVE');
      setJobs(res);
      if (!selectedJobId && res.length > 0) {
        setSelectedJobId(res[0].id);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleStartScreening = async () => {
    if (!selectedJobId) return;
    setStartingRun(true);
    setError(null);
    try {
      const run = await api.createScreeningRun(selectedJobId);
      setCompletedRun(run);
    } catch (err: any) {
      setError(err.message || 'Screening execution failed.');
    } finally {
      setStartingRun(false);
    }
  };

  const activeJob = jobs.find((j) => j.id === selectedJobId);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Explainable Candidate Screening Run
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Execute deterministic multi-factor alignment against versioned job criteria.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Role Selection & Configuration Frozen State */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Target Role & Criteria Freeze</h2>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Select Job Role to Screen</label>
          <select
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              setCompletedRun(null);
            }}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-medium"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department}) • Criteria v{j.criteriaVersion} ({j.candidateCount || 0} candidate resumes ready)
              </option>
            ))}
          </select>
        </div>

        {activeJob && (
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Frozen Criteria Version:</span>
              <span className="font-mono font-bold text-brand-400">v{activeJob.criteriaVersion}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <div>
                <span className="text-slate-500 block">Skills Weight</span>
                <span className="font-semibold text-slate-200">{activeJob.scoringWeights.requiredSkills}%</span>
              </div>
              <div>
                <span className="text-slate-500 block">Experience Weight</span>
                <span className="font-semibold text-slate-200">{activeJob.scoringWeights.experience}%</span>
              </div>
              <div>
                <span className="text-slate-500 block">Projects Weight</span>
                <span className="font-semibold text-slate-200">{activeJob.scoringWeights.projects}%</span>
              </div>
              <div>
                <span className="text-slate-500 block">Education Weight</span>
                <span className="font-semibold text-slate-200">{activeJob.scoringWeights.educationCerts}%</span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleStartScreening}
            disabled={startingRun || !selectedJobId}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50"
          >
            {startingRun ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating Evidence & Calculating Alignment...</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                <span>Execute Screening Run</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Run Complete View */}
      {completedRun && (
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 space-y-5 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Screening Run Finished Successfully</h3>
              <p className="text-xs text-slate-400">
                Run ID: <span className="font-mono text-slate-300">{completedRun.id.slice(0, 8)}</span> • {completedRun.totalProcessed} candidates evaluated
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[11px]">Submitted Resumes</span>
              <span className="text-base font-bold text-white">{completedRun.totalSubmitted}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Successfully Screened</span>
              <span className="text-base font-bold text-emerald-400">{completedRun.totalProcessed}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Criteria Snapshot</span>
              <span className="text-base font-bold text-brand-300 font-mono">v{completedRun.criteriaVersion}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              to={`/candidates?jobId=${completedRun.jobId}`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all"
            >
              <span>View Candidate Scorecards</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Methodology and Decision Support Notice */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
          <ShieldCheck className="w-4 h-4 text-brand-400" />
          <span>Decision Support Guardrail</span>
        </div>
        <p className="leading-relaxed text-[11px]">
          TalentIQ AI scores reflect documented evidence found in candidate submissions. Missing resume evidence does not prove a candidate lacks a skill. The AI system provides decision-support rankings and never performs automatic rejections.
        </p>
      </div>
    </div>
  );
};
