import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users,
  Search,
  Download,
  Scale,
  Eye,
  Loader2,
} from 'lucide-react';
import { api } from '../lib/api';
import { CandidateResult, Job, ReviewStatus } from '../types';

export const CandidateResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';

  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId);
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [minScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  const loadJobs = useCallback(async () => {
    try {
      const res = await api.listJobs();
      setJobs(res);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listCandidates({
        jobId: selectedJobId || undefined,
        reviewStatus: reviewStatusFilter || undefined,
        search: searchQuery || undefined,
        minScore: minScore > 0 ? minScore : undefined,
      });
      setCandidates(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedJobId, reviewStatusFilter, searchQuery, minScore]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCandidates();
  };

  const handleReviewStatusChange = async (candidateId: string, newStatus: ReviewStatus) => {
    try {
      await api.updateCandidateReview(candidateId, newStatus);
      // Update local state
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, reviewStatus: newStatus } : c))
      );
    } catch (err: any) {
      alert(`Could not update status: ${err.message}`);
    }
  };

  const toggleComparisonSelect = (id: string) => {
    if (selectedForComparison.includes(id)) {
      setSelectedForComparison((prev) => prev.filter((item) => item !== id));
    } else {
      if (selectedForComparison.length >= 5) {
        alert("You can compare up to 5 candidates at once.");
        return;
      }
      setSelectedForComparison((prev) => [...prev, id]);
    }
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'SHORTLISTED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'IN_REVIEW':
        return 'bg-brand-500/10 text-brand-300 border-brand-500/20';
      case 'NEEDS_VERIFICATION':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'NOT_PROCEEDING':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Candidate Alignment Scorecards
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Explainable alignment scores with evaluation coverage and traceable evidence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedForComparison.length >= 2 && (
            <Link
              to={`/comparison?jobId=${selectedJobId}&ids=${selectedForComparison.join(',')}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-accent-violet hover:bg-accent-violet/90 shadow-lg shadow-accent-violet/20 transition-all"
            >
              <Scale className="w-4 h-4" />
              <span>Compare Selected ({selectedForComparison.length})</span>
            </Link>
          )}

          {selectedJobId && (
            <a
              href={`http://localhost:8000/api/v1/reports/csv/${selectedJobId}`}
              download
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center gap-3 border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by candidate name or matched skill..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </form>

        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Jobs</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>

        <select
          value={reviewStatusFilter}
          onChange={(e) => setReviewStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Review Statuses</option>
          <option value="NOT_REVIEWED">Not Reviewed</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="SHORTLISTED">Shortlisted</option>
          <option value="NEEDS_VERIFICATION">Needs Verification</option>
          <option value="NOT_PROCEEDING">Not Proceeding</option>
        </select>
      </div>

      {/* Results Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      ) : candidates.length > 0 ? (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 w-10 text-center">Compare</th>
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Job Role</th>
                  <th className="py-3.5 px-4 text-center">Alignment Score</th>
                  <th className="py-3.5 px-4 text-center">Coverage</th>
                  <th className="py-3.5 px-4">Evidence Highlights</th>
                  <th className="py-3.5 px-4">Recruiter Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {candidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedForComparison.includes(cand.id)}
                        onChange={() => toggleComparisonSelect(cand.id)}
                        className="rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        to={`/candidates/${cand.id}`}
                        className="font-bold text-white hover:text-brand-400 text-sm block"
                      >
                        {cand.candidateName}
                      </Link>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {cand.extractedProfile?.totalExperienceYears ? `${cand.extractedProfile.totalExperienceYears} yrs exp` : 'Exp unverified'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-300 font-medium">
                      {cand.jobTitle || 'Role'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-base font-extrabold text-brand-400">
                        {cand.overallScore.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">/100</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                        {cand.evaluationCoverage}%
                      </span>
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {cand.matchedRequirements.slice(0, 3).map((m, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700/60 truncate max-w-[120px]"
                          >
                            {m.replace('Required Skill: ', '')}
                          </span>
                        ))}
                        {cand.matchedRequirements.length > 3 && (
                          <span className="text-[10px] text-slate-500">
                            +{cand.matchedRequirements.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={cand.reviewStatus}
                        onChange={(e) => handleReviewStatusChange(cand.id, e.target.value as ReviewStatus)}
                        className={`text-[10px] font-semibold rounded-lg px-2 py-1 border focus:outline-none ${getStatusBadge(
                          cand.reviewStatus
                        )} bg-slate-900 cursor-pointer`}
                      >
                        <option value="NOT_REVIEWED">Not Reviewed</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="SHORTLISTED">Shortlisted</option>
                        <option value="NEEDS_VERIFICATION">Needs Verification</option>
                        <option value="NOT_PROCEEDING">Not Proceeding</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/candidates/${cand.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-300 hover:text-white bg-brand-600/10 hover:bg-brand-600 border border-brand-500/20 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3 border border-slate-800">
          <Users className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Candidate Scorecards Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload candidate resumes and run a screening run to generate explainable alignment scorecards.
          </p>
          <div className="pt-2">
            <Link
              to="/resumes/upload"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500"
            >
              <span>Upload Resumes</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
