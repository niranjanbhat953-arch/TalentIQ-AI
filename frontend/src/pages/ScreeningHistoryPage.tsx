import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  PlayCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';
import { ScreeningRun } from '../types';

export const ScreeningHistoryPage: React.FC = () => {
  const [runs, setRuns] = useState<ScreeningRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    setLoading(true);
    try {
      const res = await api.listScreeningRuns();
      setRuns(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Screening Run Audit History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Immutable log of historical screening runs. Each run preserves its exact criteria version and scoring weights snapshot.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      ) : runs.length > 0 ? (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Target Role</th>
                  <th className="py-3.5 px-4">Run Identifier</th>
                  <th className="py-3.5 px-4">Criteria Version</th>
                  <th className="py-3.5 px-4">Candidates</th>
                  <th className="py-3.5 px-4">Frozen Weights (Skills/Exp/Proj/Edu)</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {runs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-5 font-bold text-white text-sm">
                      <Link to={`/candidates?jobId=${r.jobId}`} className="hover:text-brand-400">
                        {r.jobTitle}
                      </Link>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-400 text-[11px]">
                      {r.id.slice(0, 8)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-brand-300 border border-slate-700/60">
                        v{r.criteriaVersion}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-200 font-semibold">
                      {r.totalProcessed} evaluated
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-mono text-[10px]">
                      {r.scoringWeights?.requiredSkills || 40}/{r.scoringWeights?.experience || 25}/{r.scoringWeights?.projects || 20}/{r.scoringWeights?.educationCerts || 15}
                    </td>
                    <td className="py-4 px-4 text-slate-400">
                      {r.startedAt ? r.startedAt.slice(0, 16).replace('T', ' ') : 'Recently'}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`http://localhost:8000/api/v1/reports/csv/${r.id}`}
                          download
                          title="Export Run CSV"
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <Link
                          to={`/candidates?jobId=${r.jobId}`}
                          title="Inspect Scorecards"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-300 hover:text-white bg-brand-600/10 hover:bg-brand-600 border border-brand-500/20 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Reopen Results</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3 border border-slate-800">
          <History className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Historical Screening Runs</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Run a screening analysis from the Screening console to record immutable historical runs.
          </p>
          <div className="pt-2">
            <Link
              to="/screening"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Launch Screening Run</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
