export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'REMOTE' | 'HYBRID';
export type JobStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'CLOSED';
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'EXTRACTED' | 'FAILED';
export type ScreeningRunStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
export type EvidenceStatus = 'FOUND' | 'PARTIALLY_SUPPORTED' | 'UNCLEAR' | 'NOT_DETECTED' | 'UNEVALUABLE';
export type ReviewStatus = 'NOT_REVIEWED' | 'IN_REVIEW' | 'SHORTLISTED' | 'NEEDS_VERIFICATION' | 'NOT_PROCEEDING';

export interface ScoringWeights {
  requiredSkills: number;
  experience: number;
  projects: number;
  educationCerts: number;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  organization?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  settings?: Record<string, any>;
}

export interface Job {
  id: string;
  ownerId: string;
  title: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  status: JobStatus;
  description: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  minExperienceYears: number;
  educationRequirements: string[];
  certifications: string[];
  scoringWeights: ScoringWeights;
  criteriaVersion: number;
  createdAt: string;
  updatedAt: string;
  candidateCount?: number;
  screeningCount?: number;
}

export interface WorkExperienceItem {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  highlights: string[];
  skillsUsed: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear?: number;
}

export interface ProjectItem {
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface EvidenceSnippet {
  category: string;
  text: string;
  pageNumber?: number;
  confidence: number;
}

export interface ExtractedProfile {
  candidateName: string;
  email?: string;
  phone?: string;
  location?: string;
  summary: string;
  totalExperienceYears: number;
  workHistory: WorkExperienceItem[];
  education: EducationItem[];
  skills: string[];
  projects: ProjectItem[];
  certifications: string[];
  achievements: string[];
  evidenceSnippets: EvidenceSnippet[];
  rawTextLength: number;
  isScannedWarning: boolean;
}

export interface Resume {
  id: string;
  ownerId: string;
  jobId?: string;
  fileName: string;
  fileSize: number;
  fileHash: string;
  mimeType: string;
  processingStatus: ProcessingStatus;
  errorMessage?: string;
  extractedProfile?: ExtractedProfile;
  uploadedAt: string;
  updatedAt: string;
}

export interface SkillGapItem {
  skill: string;
  isRequired: boolean;
  status: EvidenceStatus;
  evidenceText?: string;
  verificationQuestion?: string;
}

export interface CriterionScoreBreakdown {
  requiredSkills: number;
  experience: number;
  projects: number;
  educationCerts: number;
}

export interface CandidateResult {
  id: string;
  ownerId: string;
  screeningRunId: string;
  jobId: string;
  jobTitle?: string;
  resumeId: string;
  candidateName: string;
  overallScore: number;
  evaluationCoverage: number;
  evaluableCriteriaCount: number;
  totalCriteriaCount: number;
  criterionScores: CriterionScoreBreakdown;
  skillGaps: SkillGapItem[];
  matchedRequirements: string[];
  missingRequirements: string[];
  unclearRequirements: string[];
  reviewStatus: ReviewStatus;
  recruiterNotes: string;
  processingWarnings: string[];
  extractedProfile?: ExtractedProfile;
  methodologyNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScreeningRun {
  id: string;
  ownerId: string;
  jobId: string;
  jobTitle: string;
  criteriaVersion: number;
  scoringWeights: ScoringWeights;
  matchingModel: string;
  totalSubmitted: number;
  totalProcessed: number;
  totalFailed: number;
  status: ScreeningRunStatus;
  startedAt: string;
  completedAt?: string;
}

export interface InterviewQuestion {
  id: string;
  category: 'TECHNICAL' | 'PROBLEM_SOLVING' | 'PROJECT_DEEP_DIVE' | 'BEHAVIORAL' | 'ROLE_SCENARIO';
  competency: string;
  difficulty: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD';
  questionText: string;
  relevanceReason: string;
  candidateEvidence?: string;
  expectedIndicators: string[];
  followUpProbes: string[];
}

export interface InterviewQuestionSet {
  id: string;
  ownerId: string;
  jobId: string;
  jobTitle: string;
  candidateResultId?: string;
  candidateName?: string;
  questions: InterviewQuestion[];
  generationSource: 'LLM_ASSISTED' | 'RULE_ENGINE_FALLBACK';
  createdAt: string;
}

export interface AnalyticsData {
  totalJobs: number;
  totalResumes: number;
  totalScreeningRuns: number;
  candidatesAwaitingReview: number;
  parsingSuccessCount: number;
  parsingFailedCount: number;
  scoreDistribution: Record<string, number>;
  reviewStatusCounts: Record<string, number>;
  topSkillsDemanded: Array<{ skill: string; count: number }>;
  recentScreenings: Array<{
    id: string;
    jobTitle: string;
    totalProcessed: number;
    status: string;
    startedAt: string;
  }>;
}
