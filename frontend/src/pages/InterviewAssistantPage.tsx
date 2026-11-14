import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Copy,
  Loader2,
  AlertCircle,
  Briefcase,
  ChevronRight,
  RefreshCw,
  Info,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Job, CandidateResult, InterviewQuestionSet } from '../types';

export const InterviewAssistantPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlJobId = searchParams.get('jobId') || '';
  const urlCandidateId = searchParams.get('candidateResultId') || '';

  const { idToken, loading: authLoading } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState<boolean>(false);

  const [selectedJobId, setSelectedJobId] = useState<string>(urlJobId);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(urlCandidateId);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('MID');

  const [generating, setGenerating] = useState(false);
  const [questionSet, setQuestionSet] = useState<InterviewQuestionSet | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoadingJobs(true);
    setJobsError(null);
    try {
      const res = await api.listJobs();
      const availableJobs = Array.isArray(res) ? res.filter((j) => j.status !== 'ARCHIVED') : [];
      setJobs(availableJobs);

      // Preserve URL selection if valid, or previous selection, or select first available job
      if (urlJobId && availableJobs.some((j) => j.id === urlJobId)) {
        setSelectedJobId(urlJobId);
      } else if (availableJobs.length > 0) {
        setSelectedJobId((prev) => (prev && availableJobs.some((j) => j.id === prev) ? prev : availableJobs[0].id));
      } else {
        setSelectedJobId('');
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to load saved jobs. Please check your network or sign-in state.';
      setJobsError(msg);
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  }, [urlJobId]);

  // Load jobs when auth becomes ready
  useEffect(() => {
    if (!authLoading) {
      loadJobs();
    }
  }, [authLoading, idToken, loadJobs]);

  const loadCandidatesForJob = useCallback(async (jobId: string) => {
    if (!jobId) {
      setCandidates([]);
      return;
    }
    setLoadingCandidates(true);
    try {
      const res = await api.listCandidates({ jobId });
      setCandidates(Array.isArray(res) ? res : []);
      if (urlCandidateId && Array.isArray(res) && res.some((c) => c.id === urlCandidateId)) {
        setSelectedCandidateId(urlCandidateId);
      }
    } catch (err: any) {
      console.warn('Could not load candidates for selected job:', err);
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  }, [urlCandidateId]);

  useEffect(() => {
    if (selectedJobId) {
      loadCandidatesForJob(selectedJobId);
    } else {
      setCandidates([]);
      setSelectedCandidateId('');
    }
  }, [selectedJobId, loadCandidatesForJob]);

  const handleGenerateQuestions = async () => {
    if (!selectedJobId) return;
    setGenerating(true);
    setGenerationError(null);
    try {
      const res = await api.generateInterviewQuestions({
        jobId: selectedJobId,
        candidateResultId: selectedCandidateId || undefined,
        questionCount,
        targetDifficulty: difficulty,
      });
      setQuestionSet(res);
    } catch (err: any) {
      setGenerationError(err.message || 'Question generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const copyQuestionText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Competency-Based Interview Assistant
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Generate structured interview questions, expected answer rubrics, and follow-up probes tailored to role criteria.
        </p>
      </div>

      {generationError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{generationError}</span>
        </div>
      )}

      {/* Generator Form */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Question Generation Parameters</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Target Role Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="target-role-select" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-brand-400" />
                <span>Target Role *</span>
              </label>
              {loadingJobs && (
                <span className="text-[11px] text-brand-400 flex items-center gap-1 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading roles...
                </span>
              )}
            </div>

            <select
              id="target-role-select"
              aria-label="Target Role"
              value={selectedJobId}
              disabled={loadingJobs || jobs.length === 0}
              onChange={(e) => {
                setSelectedJobId(e.target.value);
                setSelectedCandidateId('');
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingJobs ? (
                <option value="">Loading job postings...</option>
              ) : jobsError ? (
                <option value="">Error loading jobs</option>
              ) : jobs.length === 0 ? (
                <option value="">No job postings available</option>
              ) : (
                <>
                  {!selectedJobId && <option value="">Select a target role...</option>}
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} {j.department ? `(${j.department})` : ''}
                    </option>
                  ))}
                </>
              )}
            </select>

            {/* Error State with Retry */}
            {jobsError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="truncate">{jobsError}</span>
                </div>
                <button
                  type="button"
                  onClick={loadJobs}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold text-xs transition-colors flex items-center gap-1 shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Empty State: No jobs available */}
            {!loadingJobs && !jobsError && jobs.length === 0 && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5 mt-2">
                <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-200">No saved jobs found</p>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Create a job posting to extract role requirements and generate targeted interview rubrics.
                  </p>
                  <div className="pt-1 flex items-center gap-3">
                    <Link
                      to="/jobs/create"
                      className="inline-flex items-center gap-1 font-semibold text-brand-400 hover:text-brand-300 hover:underline"
                    >
                      <span>Create New Job</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                    <Link
                      to="/jobs"
                      className="text-slate-400 hover:text-slate-300 hover:underline text-[11px]"
                    >
                      View Job Postings
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Focus on Specific Candidate Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="candidate-select" className="text-xs font-semibold text-slate-300">
                Focus on Specific Candidate (Optional)
              </label>
              {loadingCandidates && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading candidates...
                </span>
              )}
            </div>
            <select
              id="candidate-select"
              aria-label="Focus on Specific Candidate"
              value={selectedCandidateId}
              disabled={!selectedJobId || candidates.length === 0}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 disabled:opacity-50"
            >
              <option value="">Role-General Questions (No specific candidate)</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.candidateName} (Score: {c.overallScore.toFixed(0)})
                </option>
              ))}
            </select>
          </div>

          {/* Number of Questions Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="question-count-select" className="text-xs font-semibold text-slate-300">
              Number of Questions
            </label>
            <select
              id="question-count-select"
              aria-label="Number of Questions"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value={3}>3 Questions (Express)</option>
              <option value={5}>5 Questions (Standard Panel)</option>
              <option value={8}>8 Questions (In-Depth Technical)</option>
            </select>
          </div>

          {/* Target Competency Depth Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="difficulty-select" className="text-xs font-semibold text-slate-300">
              Target Competency Depth
            </label>
            <select
              id="difficulty-select"
              aria-label="Target Competency Depth"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="JUNIOR">Early Career / Junior</option>
              <option value="MID">Mid-Level Engineer</option>
              <option value="SENIOR">Senior Professional</option>
              <option value="LEAD">Staff / Principal / Lead</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleGenerateQuestions}
            disabled={generating || loadingJobs || !selectedJobId || jobs.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Customized Interview Questions & Rubrics...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Tailored Question Set</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Questions List */}
      {questionSet && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">
                Generated Questions for {questionSet.jobTitle}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {questionSet.candidateName ? `Candidate Context: ${questionSet.candidateName} • ` : ''}
                {questionSet.questions.length} questions • Source:{' '}
                <span className="font-semibold text-brand-300">
                  {questionSet.generationSource === 'LLM_ASSISTED' ? 'LLM Assisted' : 'Deterministic Rule Engine'}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {questionSet.questions.map((q, idx) => (
              <div
                key={q.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-400 font-bold text-xs flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {q.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-semibold text-brand-300">
                      {q.competency}
                    </span>
                  </div>

                  <button
                    onClick={() => copyQuestionText(q.questionText, q.id)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="Copy Question Text"
                  >
                    {copiedId === q.id ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <p className="text-sm font-semibold text-white leading-relaxed">
                  "{q.questionText}"
                </p>

                <p className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Relevance: </span>
                  {q.relevanceReason}
                </p>

                {q.candidateEvidence && (
                  <div className="p-2.5 rounded-lg bg-brand-500/5 border border-brand-500/15 text-xs text-brand-300/90 font-mono">
                    <span className="font-semibold text-brand-400 font-sans">Evidence Link: </span>
                    {q.candidateEvidence}
                  </div>
                )}

                {/* Expected Answer Indicators */}
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-slate-200 block text-[11px] uppercase tracking-wider">
                    Expected Competency Indicators (Evaluation Rubric)
                  </span>
                  <ul className="space-y-1 text-slate-300">
                    {q.expectedIndicators.map((ind, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{ind}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Follow-up Probes */}
                {q.followUpProbes.length > 0 && (
                  <div className="space-y-1.5 pt-1 text-xs">
                    <span className="font-semibold text-slate-400 block text-[11px]">
                      Follow-up Probes:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                      {q.followUpProbes.map((probe, i) => (
                        <li key={i}>{probe}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
