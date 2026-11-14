import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  MessageSquare,
  FileSearch,
  Save,
  Loader2,
  Briefcase,
  GraduationCap,
  Award,
  Layers,
  Code,
  Eye,
  ShieldCheck,
  Building
} from 'lucide-react';
import { api } from '../lib/api';
import { CandidateResult, ReviewStatus, EvidenceStatus } from '../types';

export const CandidateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState<CandidateResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('NOT_REVIEWED');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      loadCandidate(id);
    }
  }, [id]);

  const loadCandidate = async (candId: string) => {
    setLoading(true);
    try {
      const res = await api.getCandidate(candId);
      setCandidate(res);
      setRecruiterNotes(res.recruiterNotes || '');
      setReviewStatus(res.reviewStatus);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReview = async () => {
    if (!id) return;
    setSavingNotes(true);
    setSaveSuccess(false);
    try {
      const updated = await api.updateCandidateReview(id, reviewStatus, recruiterNotes);
      setCandidate(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSavingNotes(false);
    }
  };

  const getEvidenceBadge = (status: EvidenceStatus) => {
    switch (status) {
      case 'FOUND':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          text: 'Found & Verified'
        };
      case 'PARTIALLY_SUPPORTED':
        return {
          icon: HelpCircle,
          color: 'text-brand-300 bg-brand-500/10 border-brand-500/20',
          text: 'Partially Supported'
        };
      case 'UNCLEAR':
        return {
          icon: AlertTriangle,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          text: 'Unclear'
        };
      case 'NOT_DETECTED':
        return {
          icon: XCircle,
          color: 'text-slate-400 bg-slate-800 border-slate-700',
          text: 'Not Detected'
        };
      case 'UNEVALUABLE':
        return {
          icon: HelpCircle,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          text: 'Unevaluable'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-sm text-slate-400">Candidate result not found.</p>
        <Link to="/candidates" className="text-xs text-brand-400 underline">Back to Candidates</Link>
      </div>
    );
  }

  const p = candidate.extractedProfile;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/candidates"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {candidate.candidateName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                Scorecard
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Position: <span className="text-slate-200 font-medium">{candidate.jobTitle}</span>
              {p?.email && ` • ${p.email}`}
              {p?.location && ` • ${p.location}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/interviews?jobId=${candidate.jobId}&candidateResultId=${candidate.id}`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
            <span>Interview Questions</span>
          </Link>

          <Link
            to={`/quality-analyzer?resumeId=${candidate.resumeId}`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all"
          >
            <FileSearch className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Resume Quality</span>
          </Link>

          <a
            href={`http://localhost:8000/api/v1/reports/pdf/${candidate.id}`}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-600/25 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF Dossier</span>
          </a>
        </div>
      </div>

      {/* Alignment Score & Criterion Breakdown */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Overall Alignment Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-brand-400">{candidate.overallScore.toFixed(1)}</span>
              <span className="text-sm text-slate-500 font-medium">/ 100</span>
            </div>
            <p className="text-xs text-slate-400 italic">
              {candidate.methodologyNote}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Evaluation Coverage</span>
              <span className="text-2xl font-black text-accent-cyan">{candidate.evaluationCoverage}%</span>
              <span className="text-[10px] text-slate-500 block">
                {candidate.evaluableCriteriaCount}/{candidate.totalCriteriaCount} criteria evaluable
              </span>
            </div>
          </div>
        </div>

        {/* 4 Criterion Sub-Scores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Required Skills (40%)</span>
            <p className="text-xl font-bold text-white">{candidate.criterionScores.requiredSkills}%</p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-brand-500 h-full rounded-full"
                style={{ width: `${candidate.criterionScores.requiredSkills}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Relevant Experience (25%)</span>
            <p className="text-xl font-bold text-white">{candidate.criterionScores.experience}%</p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-accent-cyan h-full rounded-full"
                style={{ width: `${candidate.criterionScores.experience}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Relevant Projects (20%)</span>
            <p className="text-xl font-bold text-white">{candidate.criterionScores.projects}%</p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-accent-violet h-full rounded-full"
                style={{ width: `${candidate.criterionScores.projects}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Education & Certs (15%)</span>
            <p className="text-xl font-bold text-white">{candidate.criterionScores.educationCerts}%</p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${candidate.criterionScores.educationCerts}%` }}
              />
            </div>
          </div>
        </div>

        {candidate.processingWarnings.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1">
            <span className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Processing Disclosures:
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/80">
              {candidate.processingWarnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Skill-Gap Matrix */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white">Evidence-Based Skill-Gap Matrix</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Traceable classification of job criteria against candidate resume text. Missing evidence does not prove a candidate lacks a skill.
          </p>
        </div>

        <div className="divide-y divide-slate-800/60">
          {candidate.skillGaps.map((item, idx) => {
            const badge = getEvidenceBadge(item.status);
            const Icon = badge.icon;
            return (
              <div key={idx} className="py-3.5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{item.skill}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {item.isRequired ? 'Required' : 'Preferred'}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{badge.text}</span>
                  </span>
                </div>

                {item.evidenceText && (
                  <p className="text-xs text-slate-300 font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    "{item.evidenceText}"
                  </p>
                )}

                {item.verificationQuestion && (
                  <div className="text-xs text-brand-300/90 bg-brand-500/5 p-2.5 rounded-lg border border-brand-500/15">
                    <span className="font-semibold text-brand-400">Suggested Verification Question: </span>
                    {item.verificationQuestion}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Extracted Profile Details */}
      {p && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Work Experience */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-400" />
              <span>Extracted Experience ({p.totalExperienceYears} Years Total)</span>
            </h3>

            {p.workHistory.length > 0 ? (
              <div className="space-y-4">
                {p.workHistory.map((work, idx) => (
                  <div key={idx} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-white text-sm">{work.title}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{work.endDate}</span>
                    </div>
                    <p className="text-brand-300 font-medium">{work.company}</p>
                    {work.highlights.length > 0 && (
                      <ul className="list-disc list-inside space-y-1 pt-1 text-slate-300 text-[11px]">
                        {work.highlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No structured work history items extracted.</p>
            )}
          </div>

          {/* Education & Projects */}
          <div className="space-y-6">
            {/* Education */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>Education & Credentials</span>
              </h3>

              {p.education.length > 0 ? (
                <div className="space-y-3">
                  {p.education.map((edu, idx) => (
                    <div key={idx} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-xs">
                      <p className="font-bold text-white">{edu.degree} in {edu.fieldOfStudy}</p>
                      <p className="text-slate-400 mt-0.5">{edu.institution} {edu.graduationYear ? `(${edu.graduationYear})` : ''}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No formal education entries detected.</p>
              )}

              {p.certifications.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-300 block mb-2">Certifications:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {p.certifications.map((c, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Projects */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Code className="w-4 h-4 text-accent-violet" />
                <span>Portfolio & Technical Projects</span>
              </h3>

              {p.projects.length > 0 ? (
                <div className="space-y-3">
                  {p.projects.map((proj, idx) => (
                    <div key={idx} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
                      <p className="font-bold text-white">{proj.name}</p>
                      <p className="text-slate-300 text-[11px]">{proj.description}</p>
                      {proj.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {proj.technologies.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-brand-300">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No standalone projects section found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recruiter Review & Private Notes Console */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Recruiter Review & Hiring Decision Controls</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review statuses are exclusively controlled by human recruiters, never automatically assigned as final hiring decisions by AI.
            </p>
          </div>

          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Review Saved</span>
            </span>
          )}
        </div>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5 max-w-xs">
            <label className="text-xs font-semibold text-slate-300">Set Review Status:</label>
            <select
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-semibold"
            >
              <option value="NOT_REVIEWED">Not Reviewed</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="SHORTLISTED">Shortlisted for Further Assessment</option>
              <option value="NEEDS_VERIFICATION">Needs Recruiter Verification</option>
              <option value="NOT_PROCEEDING">Not Proceeding</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Recruiter Private Evaluation Notes:</label>
            <textarea
              rows={4}
              value={recruiterNotes}
              onChange={(e) => setRecruiterNotes(e.target.value)}
              placeholder="Record candidate strengths, technical interview focus areas, compensation considerations, or qualification uncertainties..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveReview}
              disabled={savingNotes}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50"
            >
              {savingNotes && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              <span>Save Recruiter Notes & Decision</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
