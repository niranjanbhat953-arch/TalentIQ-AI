import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  PlayCircle,
  AlertCircle,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';
import { Job, Resume } from '../types';

export const ResumeUploadPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    resumes: Resume[];
    duplicateCount: number;
    failedCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await api.listJobs('ACTIVE');
      setJobs(res);
      if (res.length > 0) {
        setSelectedJobId(res[0].id);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files: File[]) => {
    const valid = files.filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      const isExtValid = ext === 'pdf' || ext === 'docx' || ext === 'doc';
      const isSizeValid = f.size <= 15 * 1024 * 1024;
      return isExtValid && isSizeValid;
    });

    if (valid.length < files.length) {
      alert("Some files were skipped because they exceed 15MB or are not in PDF/DOCX format.");
    }

    setSelectedFiles((prev) => [...prev, ...valid]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeSelectedFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const res = await api.uploadResumes(selectedFiles, selectedJobId || undefined);
      setUploadResult(res);
      setSelectedFiles([]);
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Candidate Document Processing
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Bulk upload PDF and DOCX resumes. Text extraction and evidence parsing will execute automatically.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Target Job Assignment */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <label className="text-xs font-bold text-white flex items-center gap-2">
          <span>Assign Uploaded Resumes to Target Role:</span>
        </label>
        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-medium"
        >
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} ({j.department}) • Criteria v{j.criteriaVersion}
            </option>
          ))}
          <option value="">Unassigned (General Talent Pool)</option>
        </select>
      </div>

      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-brand-500 bg-brand-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="space-y-3 max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-brand-600/15 border border-brand-500/30 flex items-center justify-center mx-auto text-brand-400">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Click to browse or drop candidate documents here</p>
            <p className="text-xs text-slate-400 mt-1">Supported formats: PDF, DOCX (up to 15MB per file)</p>
          </div>
        </div>
      </div>

      {/* Selected File Queue */}
      {selectedFiles.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              Files Ready for Processing ({selectedFiles.length})
            </h3>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-xs text-slate-400 hover:text-rose-400"
            >
              Clear All
            </button>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-60 overflow-y-auto">
            {selectedFiles.map((f, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 truncate pr-4">
                  <FileText className="w-4 h-4 text-brand-400 shrink-0" />
                  <span className="text-slate-200 font-medium truncate">{f.name}</span>
                  <span className="text-slate-400 font-mono text-[11px] shrink-0">
                    ({(f.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSelectedFile(idx);
                  }}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleUploadSubmit}
              disabled={uploading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50"
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Upload & Parse {selectedFiles.length} Document(s)</span>
            </button>
          </div>
        </div>
      )}

      {/* Upload Results & Scanned Warnings */}
      {uploadResult && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Document Processing Completed</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {uploadResult.resumes.length} parsed successfully
                {uploadResult.duplicateCount > 0 && ` • ${uploadResult.duplicateCount} duplicate(s) skipped`}
                {uploadResult.failedCount > 0 && ` • ${uploadResult.failedCount} failed`}
              </p>
            </div>

            {selectedJobId && uploadResult.resumes.length > 0 && (
              <Link
                to={`/screening?jobId=${selectedJobId}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 transition-all"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Screen Candidates for Role</span>
              </Link>
            )}
          </div>

          <div className="space-y-3">
            {uploadResult.resumes.map((r) => {
              const p = r.extractedProfile;
              return (
                <div
                  key={r.id}
                  className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {p?.candidateName || r.fileName}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {p?.email && `${p.email} • `}
                        {p?.totalExperienceYears ? `${p.totalExperienceYears} yrs exp • ` : ''}
                        {r.fileName}
                      </p>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Extracted
                    </span>
                  </div>

                  {p?.isScannedWarning && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>Low extractable text layer detected. Document appears to be a scanned image.</span>
                    </div>
                  )}

                  {p?.skills && p.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.skills.slice(0, 8).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700/60">
                          {s}
                        </span>
                      ))}
                      {p.skills.length > 8 && (
                        <span className="text-[10px] text-slate-500 pt-0.5">+{p.skills.length - 8} more</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
