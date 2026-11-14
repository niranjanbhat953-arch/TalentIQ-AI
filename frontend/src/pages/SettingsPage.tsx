import React, { useEffect, useState } from 'react';
import {
  Settings,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  Lock,
  Layers,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ScoringWeights } from '../types';

export const SettingsPage: React.FC = () => {
  const { profile, signOut } = useAuth();

  const [defaultWeights, setDefaultWeights] = useState<ScoringWeights>({
    requiredSkills: 40.0,
    experience: 25.0,
    projects: 20.0,
    educationCerts: 15.0,
  });
  const [autoArchiveDays, setAutoArchiveDays] = useState<number>(90);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Deletion modal state
  const [deleteScope, setDeleteScope] = useState<'JOB_AND_RESULTS' | 'FULL_ACCOUNT_DATA' | null>(null);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [targetResourceId, setTargetResourceId] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await api.getSettings();
      if (s.defaultWeights) setDefaultWeights(s.defaultWeights);
      if (s.autoArchiveDays) setAutoArchiveDays(s.autoArchiveDays);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);
    try {
      await api.updateSettings({
        defaultWeights,
        autoArchiveDays,
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExecuteDeletion = async () => {
    if (!deleteScope) return;
    if (confirmationInput.trim() !== 'DELETE') {
      alert("Please type 'DELETE' in all caps to confirm.");
      return;
    }

    setDeleting(true);
    try {
      const res = await api.deleteData(deleteScope, targetResourceId || undefined, 'DELETE');
      setDeleteResult(res.message);
      if (deleteScope === 'FULL_ACCOUNT_DATA') {
        setTimeout(async () => {
          await signOut();
          window.location.href = '/';
        }, 2000);
      }
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setDeleting(false);
      setDeleteScope(null);
      setConfirmationInput('');
      setTargetResourceId('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Settings & Privacy Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure default scoring rubrics, organizational preferences, and GDPR/DPDP data deletion workflows.
        </p>
      </div>

      {settingsSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>System preferences updated successfully.</span>
        </div>
      )}

      {deleteResult && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{deleteResult}</span>
        </div>
      )}

      {/* Recruiter Profile Summary */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Authenticated Account Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Name</span>
            <span className="font-semibold text-white">{profile?.displayName || 'Recruiter'}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Email</span>
            <span className="font-semibold text-white">{profile?.email}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Role</span>
            <span className="font-semibold text-brand-300 uppercase">{profile?.role || 'Recruiter'}</span>
          </div>
        </div>
      </div>

      {/* Default Matching Weights */}
      <form onSubmit={handleSaveSettings} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Default Role Scoring Rubric</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              These initial weights populate newly created job descriptions automatically.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-300">Required Skills</span>
              <span className="font-mono text-brand-400">{defaultWeights.requiredSkills}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={defaultWeights.requiredSkills}
              onChange={(e) => setDefaultWeights({ ...defaultWeights, requiredSkills: Number(e.target.value) })}
              className="w-full accent-brand-500"
            />
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-300">Relevant Experience</span>
              <span className="font-mono text-brand-400">{defaultWeights.experience}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={defaultWeights.experience}
              onChange={(e) => setDefaultWeights({ ...defaultWeights, experience: Number(e.target.value) })}
              className="w-full accent-brand-500"
            />
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-300">Relevant Projects</span>
              <span className="font-mono text-brand-400">{defaultWeights.projects}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={defaultWeights.projects}
              onChange={(e) => setDefaultWeights({ ...defaultWeights, projects: Number(e.target.value) })}
              className="w-full accent-brand-500"
            />
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-300">Education & Certifications</span>
              <span className="font-mono text-brand-400">{defaultWeights.educationCerts}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={defaultWeights.educationCerts}
              onChange={(e) => setDefaultWeights({ ...defaultWeights, educationCerts: Number(e.target.value) })}
              className="w-full accent-brand-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingSettings}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-600/30 transition-all disabled:opacity-50"
          >
            {savingSettings && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>

      {/* GDPR & DPDP Data Deletion Console */}
      <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 bg-rose-950/5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Data Retention & Deletion Console (GDPR / DPDP)</h2>
            <p className="text-xs text-slate-400">
              Permanently purge original resume files, extracted candidate profiles, and historical screening runs.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <h4 className="font-bold text-white text-sm">Purge Account Data & Candidate Records</h4>
              <p className="text-slate-400 mt-0.5">
                Permanently wipes all uploaded resumes, extracted texts, jobs, and screening runs owned by your user ID.
              </p>
            </div>
            <button
              onClick={() => setDeleteScope('FULL_ACCOUNT_DATA')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/30 transition-all shrink-0"
            >
              Purge All Data
            </button>
          </div>
        </div>
      </div>

      {/* Deletion Confirmation Modal */}
      {deleteScope && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Irreversible Data Removal</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action cannot be undone. All original resume documents, extracted evidence, and screening scores will be permanently deleted from database and storage.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Type <span className="font-mono text-rose-400 font-bold">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="Type DELETE"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setDeleteScope(null);
                  setConfirmationInput('');
                }}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDeletion}
                disabled={deleting || confirmationInput !== 'DELETE'}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Execute Irreversible Deletion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
