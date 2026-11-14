import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Archive,
  Trash2,
  Users,
  PlayCircle,
  AlertTriangle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { api } from '../lib/api';
import { Job } from '../types';

export const JobListingsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [statusFilter]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await api.listJobs(statusFilter || undefined, search || undefined);
      setJobs(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs();
  };

  const handleToggleArchive = async (id: string) => {
    try {
      await api.toggleArchiveJob(id);
      loadJobs();
    } catch (err: any) {
      alert(`Archive toggle failed: ${err.message}`);
    }
  };

  const handleDeleteJob = async (id: string) => {
    setActionLoading(true);
    try {
      await api.deleteJob(id);
      setDeleteConfirmId(null);
      loadJobs();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Job Descriptions & Criteria
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage target roles, versioned requirements, and customized evaluation scoring weights.
          </p>
        </div>

        <Link
          to="/jobs/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-600/25 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Job</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role title, department..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      ) : jobs.length > 0 ? (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Role Title</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Criteria Ver.</th>
                  <th className="py-3.5 px-4">Resumes</th>
                  <th className="py-3.5 px-4">Screenings</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-5">
                      <Link to={`/candidates?jobId=${job.id}`} className="font-bold text-white hover:text-brand-400 text-sm">
                        {job.title}
                      </Link>
                      <p className="text-[11px] text-slate-400 mt-0.5">{job.location} • {job.employmentType.replace('_', ' ')}</p>
                    </td>
                    <td className="py-4 px-4 text-slate-300 font-medium">{job.department}</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-brand-300 border border-slate-700/60">
                        v{job.criteriaVersion}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-300 font-semibold">{job.candidateCount || 0}</td>
                    <td className="py-4 px-4 text-slate-300 font-semibold">{job.screeningCount || 0}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          job.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/candidates?jobId=${job.id}`}
                          title="View Candidates"
                          className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
                        >
                          <Users className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/jobs/${job.id}/edit`}
                          title="Edit Job Criteria"
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleToggleArchive(job.id)}
                          title={job.status === 'ACTIVE' ? 'Archive Job' : 'Unarchive Job'}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(job.id)}
                          title="Delete Job"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
          <Briefcase className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Job Profiles Created</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create your first role profile to configure required skills, responsibilities, and scoring weights.
          </p>
          <div className="pt-2">
            <Link
              to="/jobs/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Job</span>
            </Link>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Confirm Job Deletion</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete this job profile? This will also purge associated screening runs and scores according to data retention policy.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteJob(deleteConfirmId)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Job</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
