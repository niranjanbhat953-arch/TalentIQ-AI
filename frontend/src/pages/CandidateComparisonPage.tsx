import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  Loader2,
  Users,
  Eye,
  ShieldAlert
} from 'lucide-react';
import { api } from '../lib/api';
import { CandidateResult, Job } from '../types';

export const CandidateComparisonPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlJobId = searchParams.get('jobId') || '';
  const urlIds = searchParams.get('ids')?.split(',').filter(Boolean) || [];

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(urlJobId);
  const [availableCandidates, setAvailableCandidates] = useState<CandidateResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(urlIds);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadCandidatesForJob(selectedJobId);
    }
  }, [selectedJobId]);

  useEffect(() => {
    if (selectedJobId && selectedIds.length >= 2) {
      runComparison();
    }
  }, [selectedIds]);

  const loadJobs = async () => {
    try {
      const res = await api.listJobs();
      setJobs(res);
      if (!selectedJobId && res.length > 0) {
        setSelectedJobId(res[0].id);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadCandidatesForJob = async (jobId: string) => {
    try {
      const res = await api.listCandidates({ jobId });
      setAvailableCandidates(res);
      if (selectedIds.length === 0 && res.length >= 2) {
        setSelectedIds(res.slice(0, 3).map((c) => c.id));
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const runComparison = async () => {
    if (selectedIds.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.compareCandidates(selectedJobId, selectedIds);
      setComparisonData(res);
    } catch (err: any) {
      setError(err.message || 'Comparison failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectCandidate = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 2) {
        alert("At least 2 candidates must be selected to compare.");
        return;
      }
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } else {
      if (selectedIds.length >= 5) {
        alert("A maximum of 5 candidates can be compared simultaneously.");
        return;
      }
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/candidates"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Candidate Side-by-Side Comparison
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Normalized evaluation of 2 to 5 candidates screened against consistent job criteria.
            </p>
          </div>
        </div>

        {/* Job selector */}
        <div className="w-full sm:w-auto">
          <select
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              setSelectedIds([]);
              setComparisonData(null);
            }}
            className="w-full sm:w-64 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-semibold"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} (v{j.criteriaVersion})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidate Selector Badges */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <label className="text-xs font-bold text-white flex items-center justify-between">
          <span>Select Candidates to Compare (2 to 5):</span>
          <span className="text-slate-400 font-normal">{selectedIds.length} of 5 selected</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {availableCandidates.map((c) => {
            const isSelected = selectedIds.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleSelectCandidate(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-brand-600/20 text-brand-300 border-brand-500/40 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{c.candidateName}</span>
                <span className="text-[10px] font-mono text-slate-400">({c.overallScore.toFixed(0)})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Warning Banner if Criteria Versions Differ */}
      {comparisonData?.warningMessage && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
          <span>{comparisonData.warningMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Comparison Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      ) : comparisonData?.candidates ? (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-300">
                  <th className="py-4 px-5 w-48 text-[11px] uppercase tracking-wider text-slate-400">
                    Evaluation Factor
                  </th>
                  {comparisonData.candidates.map((c: CandidateResult) => (
                    <th key={c.id} className="py-4 px-5 text-center min-w-[200px]">
                      <Link to={`/candidates/${c.id}`} className="font-bold text-white hover:text-brand-400 text-sm block">
                        {c.candidateName}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {c.extractedProfile?.totalExperienceYears ? `${c.extractedProfile.totalExperienceYears} yrs experience` : ''}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {/* Overall Score */}
                <tr className="bg-slate-900/30">
                  <td className="py-4 px-5 font-bold text-white">Overall Alignment Score</td>
                  {comparisonData.candidates.map((c: CandidateResult) => (
                    <td key={c.id} className="py-4 px-5 text-center">
                      <span className="text-2xl font-black text-brand-400">{c.overallScore.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-500 block">/ 100</span>
                    </td>
                  ))}
                </tr>

                {/* Evaluation Coverage */}
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-slate-300">Evaluation Coverage</td>
                  {comparisonData.candidates.map((c: CandidateResult) => (
                    <td key={c.id} className="py-3.5 px-5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                        {c.evaluationCoverage}%
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Required Skills Score */}
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-slate-300">Required Skills Score (40%)</td>
                  {comparisonData.candidates.map((c: CandidateResult) => (
                    <td key={c.id} className="py-3.5 px-5 text-center font-bold text-white">
                      {c.criterionScores.requiredSkills}%
                    </td>
                  ))}
                </tr>

                {/* Experience Score */}
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-slate-300">Relevant Experience Score (25%)</td>
                  {comparisonData.candidates.map((c: CandidateResult) => (
                    <td key={c.id} className="py-3.5 px-5 text-center font-bold text-white">
                      {c.criterionScores.experience}%
                    </td>
                  ))}
                </tr>

                {/* Projects Score */}
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-slate-300">Relevant Projects Score (20%)</td>
                  {comparisonData.candidates.map((c: CandidateResult) => (
                    <td key={c.id} className="py-3.5 px-5 text-center font-bold text-white">
                      {c.criterionScores.projects}%
                    </td>
                  ))}
                </tr>

                {/* Education & Certs */}
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-slate-300">Education & Certs Score (15%)</td>
                  {comparisonData.candidates.map((c: CandidateResult) => (
                    <td key={c.id} className="py-3.5 px-5 text-center font-bold text-white">
                      {c.criterionScores.educationCerts}%
                    </td>
                  ))}
                </tr>

                {/* Matched Requirements */}
                <tr className="align-top">
                  <td className="py-4 px-5 font-semibold text-slate-300">Verified Evidence Matches</td>
                  {comparisonData.candidates.map((c: CandidateResult) => (
                    <td key={c.id} className="py-4 px-5 space-y-1.5">
                      {c.matchedRequirements.slice(0, 4).map((m, idx) => (
                        <div key={idx} className="flex items-start gap-1 text-[11px] text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span className="truncate">{m.replace('Required Skill: ', '')}</span>
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>

                {/* Unclear / Needing Verification */}
                <tr className="align-top">
                  <td className="py-4 px-5 font-semibold text-slate-300">Needs Verification</td>
                  {comparisonData.candidates.map((c: CandidateResult) => {
                    const needs = [...c.missingRequirements, ...c.unclearRequirements];
                    return (
                      <td key={c.id} className="py-4 px-5 space-y-1.5">
                        {needs.length > 0 ? (
                          needs.slice(0, 3).map((u, idx) => (
                            <div key={idx} className="flex items-start gap-1 text-[11px] text-amber-400">
                              <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span className="truncate">{u.replace('Required Skill: ', '')}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">None flagged</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Review Status */}
                <tr>
                  <td className="py-4 px-5 font-semibold text-slate-300">Recruiter Review Status</td>
                  {comparisonData.candidates.map((c: CandidateResult) => (
                    <td key={c.id} className="py-4 px-5 text-center">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {c.reviewStatus.replace('_', ' ')}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3 border border-slate-800">
          <Scale className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">Select at Least 2 Candidates</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Choose candidates above to view side-by-side alignment breakdowns and verified evidence.
          </p>
        </div>
      )}

      {/* Decision Support Reminder */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
        <span className="font-semibold text-slate-300 block">Responsible AI Comparison Notice:</span>
        <p className="leading-relaxed text-[11px]">
          Score differentials reflect explicit evidence extracted from resumes. A higher score reflects documented alignment with the criteria, not objective human worth or guaranteed performance. Human interviewers should explore both matched and unverified competencies.
        </p>
      </div>
    </div>
  );
};
