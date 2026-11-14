import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Briefcase,
  Sparkles,
  SlidersHorizontal,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info
} from 'lucide-react';
import { api } from '../lib/api';
import { ScoringWeights, EmploymentType, JobStatus } from '../types';

export const CreateEditJobPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const isEditing = Boolean(jobId);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [location, setLocation] = useState('Remote');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('FULL_TIME');
  const [status, setStatus] = useState<JobStatus>('ACTIVE');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState<string[]>(['']);
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['']);
  const [preferredSkills, setPreferredSkills] = useState<string[]>(['']);
  const [minExperienceYears, setMinExperienceYears] = useState<number>(3.0);
  const [educationRequirements, setEducationRequirements] = useState<string[]>(["Bachelor's degree in Computer Science or related field"]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [criteriaVersion, setCriteriaVersion] = useState<number>(1);

  // Scoring Weights
  const [weights, setWeights] = useState<ScoringWeights>({
    requiredSkills: 40.0,
    experience: 25.0,
    projects: 20.0,
    educationCerts: 15.0,
  });

  const totalWeight = weights.requiredSkills + weights.experience + weights.projects + weights.educationCerts;
  const isWeightValid = Math.abs(totalWeight - 100.0) < 0.1;

  useEffect(() => {
    if (jobId) {
      loadJob(jobId);
    }
  }, [jobId]);

  const loadJob = async (id: string) => {
    setLoading(true);
    try {
      const j = await api.getJob(id);
      setTitle(j.title);
      setDepartment(j.department);
      setLocation(j.location);
      setEmploymentType(j.employmentType);
      setStatus(j.status);
      setDescription(j.description);
      setResponsibilities(j.responsibilities.length ? j.responsibilities : ['']);
      setRequiredSkills(j.requiredSkills.length ? j.requiredSkills : ['']);
      setPreferredSkills(j.preferredSkills.length ? j.preferredSkills : ['']);
      setMinExperienceYears(j.minExperienceYears);
      setEducationRequirements(j.educationRequirements.length ? j.educationRequirements : ['']);
      setCertifications(j.certifications || []);
      setWeights(j.scoringWeights);
      setCriteriaVersion(j.criteriaVersion);
    } catch (err: any) {
      setError(err.message || 'Failed to load job profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeJD = async () => {
    if (!description || description.trim().length < 20) {
      alert("Please provide at least 20 characters in the description box to extract structured criteria.");
      return;
    }
    setAnalyzing(true);
    try {
      const parsed = await api.parseJobDescription(description);
      if (parsed.title) setTitle(parsed.title);
      if (parsed.department) setDepartment(parsed.department);
      if (parsed.responsibilities?.length) setResponsibilities(parsed.responsibilities);
      if (parsed.requiredSkills?.length) setRequiredSkills(parsed.requiredSkills);
      if (parsed.preferredSkills?.length) setPreferredSkills(parsed.preferredSkills);
      if (parsed.minExperienceYears) setMinExperienceYears(parsed.minExperienceYears);
      if (parsed.educationRequirements?.length) setEducationRequirements(parsed.educationRequirements);
      if (parsed.certifications?.length) setCertifications(parsed.certifications);
      if (parsed.suggestedWeights) setWeights(parsed.suggestedWeights);
    } catch (err: any) {
      alert(`Job analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWeightValid) {
      alert("Scoring weights must sum to exactly 100%.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      title,
      department,
      location,
      employmentType,
      status,
      description,
      responsibilities: responsibilities.map((r) => r.trim()).filter(Boolean),
      requiredSkills: requiredSkills.map((s) => s.trim()).filter(Boolean),
      preferredSkills: preferredSkills.map((s) => s.trim()).filter(Boolean),
      minExperienceYears: Number(minExperienceYears),
      educationRequirements: educationRequirements.map((e) => e.trim()).filter(Boolean),
      certifications: certifications.map((c) => c.trim()).filter(Boolean),
      scoringWeights: weights,
    };

    try {
      if (isEditing && jobId) {
        await api.updateJob(jobId, payload);
      } else {
        await api.createJob(payload);
      }
      navigate('/jobs');
    } catch (err: any) {
      setError(err.message || 'Failed to save job profile.');
    } finally {
      setSaving(false);
    }
  };

  // Helper for dynamic string arrays
  const updateList = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number, val: string) => {
    setter((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const addListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, '']);
  };

  const removeListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number) => {
    setter((prev) => prev.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-3">
        <Link
          to="/jobs"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            {isEditing ? `Edit Job Criteria (Version ${criteriaVersion})` : 'Create Job Profile'}
          </h1>
          <p className="text-xs text-slate-400">
            Define requirements, competencies, and scoring weights for deterministic candidate screening.
          </p>
        </div>
      </div>

      {isEditing && (
        <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs flex items-center gap-3">
          <Info className="w-5 h-5 shrink-0 text-brand-400" />
          <span>
            <b>Criteria Version Notice:</b> Saving modifications to this job will increment the criteria version to <b>v{criteriaVersion + 1}</b>. Previous historical screening runs will remain frozen to preserve audit integrity.
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Info */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Role Fundamentals</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Job Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Backend Systems Engineer"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Department *</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Infrastructure & Cloud"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remote (US) or Bengaluru, India"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="FULL_TIME">Full-Time</option>
                <option value="PART_TIME">Part-Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Description & Auto-Extractor */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Raw Job Description Text</label>
              <button
                type="button"
                onClick={handleAnalyzeJD}
                disabled={analyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 transition-all disabled:opacity-50"
              >
                {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-brand-400" />}
                <span>Auto-Extract Criteria from Text</span>
              </button>
            </div>
            <textarea
              rows={6}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste raw job description text here, or describe role responsibilities and requirements..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 leading-relaxed font-mono"
            />
          </div>
        </div>

        {/* Structured Requirements */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Structured Requirements</h2>

          {/* Required Skills */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white">Required Core Skills (Normalized)</label>
                <p className="text-[11px] text-slate-400">Skills candidates must demonstrate in work experience or projects.</p>
              </div>
              <button
                type="button"
                onClick={() => addListItem(setRequiredSkills)}
                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Skill
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {requiredSkills.map((skill, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => updateList(setRequiredSkills, idx, e.target.value)}
                    placeholder="e.g. Python, Kubernetes, React"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                  {requiredSkills.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeListItem(setRequiredSkills, idx)}
                      className="p-2 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preferred Skills */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white">Preferred / Nice-to-Have Skills</label>
                <p className="text-[11px] text-slate-400">Optional skills that provide additional score signals.</p>
              </div>
              <button
                type="button"
                onClick={() => addListItem(setPreferredSkills)}
                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Preferred
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {preferredSkills.map((skill, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => updateList(setPreferredSkills, idx, e.target.value)}
                    placeholder="e.g. Terraform, GraphQL, Redis"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                  {preferredSkills.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeListItem(setPreferredSkills, idx)}
                      className="p-2 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Experience & Education */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Min. Relevant Experience (Years)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={minExperienceYears}
                onChange={(e) => setMinExperienceYears(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Education Target</label>
              <input
                type="text"
                value={educationRequirements[0] || ''}
                onChange={(e) => setEducationRequirements([e.target.value])}
                placeholder="e.g. Bachelor's in CS or equivalent experience"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Scoring Weights Calculator */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Scoring Methodology Weights</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Weights must sum to exactly 100%. If a criterion is unevaluable in a resume, weights renormalize dynamically.
              </p>
            </div>

            <div className={`px-3 py-1 rounded-xl text-xs font-bold font-mono border ${
              isWeightValid
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              Total: {totalWeight.toFixed(0)}%
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Required Skills Weight</span>
                <span className="font-mono text-brand-400">{weights.requiredSkills}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.requiredSkills}
                onChange={(e) => setWeights({ ...weights, requiredSkills: Number(e.target.value) })}
                className="w-full accent-brand-500"
              />
            </div>

            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Relevant Experience Weight</span>
                <span className="font-mono text-brand-400">{weights.experience}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.experience}
                onChange={(e) => setWeights({ ...weights, experience: Number(e.target.value) })}
                className="w-full accent-brand-500"
              />
            </div>

            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Relevant Projects Weight</span>
                <span className="font-mono text-brand-400">{weights.projects}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.projects}
                onChange={(e) => setWeights({ ...weights, projects: Number(e.target.value) })}
                className="w-full accent-brand-500"
              />
            </div>

            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Education & Certs Weight</span>
                <span className="font-mono text-brand-400">{weights.educationCerts}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.educationCerts}
                onChange={(e) => setWeights({ ...weights, educationCerts: Number(e.target.value) })}
                className="w-full accent-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to="/jobs"
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !isWeightValid}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isEditing ? 'Save Updated Criteria' : 'Publish Job Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
