import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { api } from '../lib/api';
import { Resume } from '../types';

export const ResumeQualityAnalyzerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlResumeId = searchParams.get('resumeId') || '';

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(urlResumeId);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadResumes = useCallback(async () => {
    try {
      const res = await api.listResumes();
      const extracted = res.filter((r) => r.extractedProfile);
      setResumes(extracted);
      if (!selectedResumeId && extracted.length > 0) {
        setSelectedResumeId(extracted[0].id);
      }
    } catch (err: any) {
      console.error(err);
    }
  }, [selectedResumeId]);

  const runAnalysis = useCallback(async (resumeId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.analyzeResumeQuality(resumeId);
      setAnalysis(res);
    } catch (err: any) {
      setError(err.message || 'Quality analysis failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  useEffect(() => {
    if (selectedResumeId) {
      runAnalysis(selectedResumeId);
    }
  }, [selectedResumeId, runAnalysis]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Resume Presentation Quality Audit
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Objective evaluation of document clarity, metric-backed accomplishments, and evidence consistency.
        </p>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1.5">
        <div className="flex items-center gap-2 text-brand-400 font-semibold">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Notice on Presentation Quality vs. Candidate Competence</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          This audit analyzes how clearly a resume is formatted and communicates achievements. It distinguishes presentation style from real candidate ability. It does <b>not</b> penalize employment gaps, career transitions, or nontraditional education.
        </p>
      </div>

      {/* Select Resume */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <label className="text-xs font-bold text-white">Select Resume Document to Audit:</label>
        <select
          value={selectedResumeId}
          onChange={(e) => setSelectedResumeId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-semibold"
        >
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.extractedProfile?.candidateName || r.fileName} ({r.fileName})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      ) : analysis ? (
        <div className="space-y-6 animate-fade-in">
          {/* Quality Score Header */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Presentation Clarity Index
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black text-accent-cyan">
                  {analysis.presentationClarityScore}
                </span>
                <span className="text-sm text-slate-500 font-medium">/ 100</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Candidate: <span className="font-semibold text-white">{analysis.candidateName}</span>
              </p>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                {analysis.presentationClarityScore >= 80 ? 'Well Structured' : 'Formatting Refinements Suggested'}
              </span>
            </div>
          </div>

          {/* Strengths */}
          {analysis.strengths && analysis.strengths.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Document Presentation Strengths</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {analysis.strengths.map((s: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actionable Findings */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>Actionable Constructive Feedback ({analysis.findings.length})</span>
            </h3>

            {analysis.findings.length > 0 ? (
              <div className="space-y-4">
                {analysis.findings.map((f: any, idx: number) => (
                  <div key={idx} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{f.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {f.severity}
                      </span>
                    </div>

                    <p className="text-slate-400">{f.observation}</p>

                    <div className="p-3 rounded-lg bg-brand-500/5 border border-brand-500/15 text-brand-300 text-[11px] leading-relaxed">
                      <span className="font-semibold text-brand-400">Constructive Recommendation: </span>
                      {f.constructiveFeedback}
                    </div>

                    {f.relevantSnippet && (
                      <p className="text-slate-400 font-mono text-[10px] bg-slate-950 p-2 rounded border border-slate-800/80">
                        Reference: "{f.relevantSnippet}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No structural weaknesses or vague phrases detected.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3 border border-slate-800">
          <FileText className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Extracted Resume Selected</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Choose an extracted resume above to run the presentation quality analysis.
          </p>
        </div>
      )}
    </div>
  );
};
