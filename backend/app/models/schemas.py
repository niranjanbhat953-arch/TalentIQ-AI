from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from enum import Enum

# --- Enums ---

class EmploymentType(str, Enum):
    FULL_TIME = "FULL_TIME"
    PART_TIME = "PART_TIME"
    CONTRACT = "CONTRACT"
    REMOTE = "REMOTE"
    HYBRID = "HYBRID"

class JobStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    CLOSED = "CLOSED"

class ProcessingStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    EXTRACTED = "EXTRACTED"
    FAILED = "FAILED"

class ScreeningRunStatus(str, Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"

class EvidenceStatus(str, Enum):
    FOUND = "FOUND"
    PARTIALLY_SUPPORTED = "PARTIALLY_SUPPORTED"
    UNCLEAR = "UNCLEAR"
    NOT_DETECTED = "NOT_DETECTED"
    UNEVALUABLE = "UNEVALUABLE"

class ReviewStatus(str, Enum):
    NOT_REVIEWED = "NOT_REVIEWED"
    IN_REVIEW = "IN_REVIEW"
    SHORTLISTED = "SHORTLISTED"
    NEEDS_VERIFICATION = "NEEDS_VERIFICATION"
    NOT_PROCEEDING = "NOT_PROCEEDING"

class QuestionCategory(str, Enum):
    TECHNICAL = "TECHNICAL"
    PROBLEM_SOLVING = "PROBLEM_SOLVING"
    PROJECT_DEEP_DIVE = "PROJECT_DEEP_DIVE"
    BEHAVIORAL = "BEHAVIORAL"
    ROLE_SCENARIO = "ROLE_SCENARIO"

class QuestionDifficulty(str, Enum):
    JUNIOR = "JUNIOR"
    MID = "MID"
    SENIOR = "SENIOR"
    LEAD = "LEAD"


# --- Common & Auth Models ---

class ScoringWeights(BaseModel):
    requiredSkills: float = Field(default=40.0, ge=0.0, le=100.0)
    experience: float = Field(default=25.0, ge=0.0, le=100.0)
    projects: float = Field(default=20.0, ge=0.0, le=100.0)
    educationCerts: float = Field(default=15.0, ge=0.0, le=100.0)

    def validate_sum(self) -> bool:
        total = self.requiredSkills + self.experience + self.projects + self.educationCerts
        return abs(total - 100.0) < 0.01

class UserProfile(BaseModel):
    id: str
    email: str
    displayName: Optional[str] = None
    photoUrl: Optional[str] = None
    organization: Optional[str] = None
    role: str = "recruiter"
    createdAt: str
    updatedAt: str
    settings: Dict[str, Any] = Field(default_factory=dict)

class UserSyncRequest(BaseModel):
    displayName: Optional[str] = None
    photoUrl: Optional[str] = None
    organization: Optional[str] = None


# --- Job Models ---

class CustomCriterion(BaseModel):
    id: str
    name: str
    weight: float = 10.0
    description: str

class JobBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    department: str = Field(..., min_length=1, max_length=100)
    location: str = Field(default="Remote", max_length=100)
    employmentType: EmploymentType = EmploymentType.FULL_TIME
    status: JobStatus = JobStatus.ACTIVE
    description: str = Field(..., min_length=10)
    responsibilities: List[str] = Field(default_factory=list)
    requiredSkills: List[str] = Field(default_factory=list)
    preferredSkills: List[str] = Field(default_factory=list)
    minExperienceYears: float = Field(default=0.0, ge=0.0)
    educationRequirements: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    customCriteria: List[CustomCriterion] = Field(default_factory=list)
    scoringWeights: ScoringWeights = Field(default_factory=ScoringWeights)

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employmentType: Optional[EmploymentType] = None
    status: Optional[JobStatus] = None
    description: Optional[str] = None
    responsibilities: Optional[List[str]] = None
    requiredSkills: Optional[List[str]] = None
    preferredSkills: Optional[List[str]] = None
    minExperienceYears: Optional[float] = None
    educationRequirements: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    customCriteria: Optional[List[CustomCriterion]] = None
    scoringWeights: Optional[ScoringWeights] = None

class JobResponse(JobBase):
    id: str
    ownerId: str
    criteriaVersion: int
    createdAt: str
    updatedAt: str
    candidateCount: int = 0
    screeningCount: int = 0

class JobParseRequest(BaseModel):
    rawText: str = Field(..., min_length=20)

class JobParseResponse(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    responsibilities: List[str] = Field(default_factory=list)
    requiredSkills: List[str] = Field(default_factory=list)
    preferredSkills: List[str] = Field(default_factory=list)
    minExperienceYears: float = 0.0
    educationRequirements: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    suggestedWeights: ScoringWeights = Field(default_factory=ScoringWeights)


# --- Resume Models ---

class WorkExperienceItem(BaseModel):
    company: str
    title: str
    startDate: str
    endDate: str = "Present"
    highlights: List[str] = Field(default_factory=list)
    skillsUsed: List[str] = Field(default_factory=list)

class EducationItem(BaseModel):
    institution: str
    degree: str
    fieldOfStudy: str
    graduationYear: Optional[int] = None

class ProjectItem(BaseModel):
    name: str
    description: str
    technologies: List[str] = Field(default_factory=list)
    link: Optional[str] = None

class EvidenceSnippet(BaseModel):
    category: str
    text: str
    pageNumber: Optional[int] = None
    confidence: float = 1.0

class ExtractedProfile(BaseModel):
    candidateName: str = "Unknown Candidate"
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    summary: str = ""
    totalExperienceYears: float = 0.0
    workHistory: List[WorkExperienceItem] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    evidenceSnippets: List[EvidenceSnippet] = Field(default_factory=list)
    rawTextLength: int = 0
    isScannedWarning: bool = False

class ResumeResponse(BaseModel):
    id: str
    ownerId: str
    jobId: Optional[str] = None
    fileName: str
    fileSize: int
    fileHash: str
    mimeType: str
    processingStatus: ProcessingStatus
    errorMessage: Optional[str] = None
    extractedProfile: Optional[ExtractedProfile] = None
    uploadedAt: str
    updatedAt: str

class ResumeUploadResponse(BaseModel):
    resumes: List[ResumeResponse]
    duplicateCount: int = 0
    failedCount: int = 0


# --- Screening & Matching Models ---

class ScreeningRunCreate(BaseModel):
    jobId: str
    resumeIds: Optional[List[str]] = None  # None = screen all unprocessed resumes for job
    customWeights: Optional[ScoringWeights] = None

class ScreeningRunResponse(BaseModel):
    id: str
    ownerId: str
    jobId: str
    jobTitle: str
    criteriaVersion: int
    scoringWeights: ScoringWeights
    matchingModel: str
    totalSubmitted: int
    totalProcessed: int
    totalFailed: int
    status: ScreeningRunStatus
    startedAt: str
    completedAt: Optional[str] = None

class SkillGapItem(BaseModel):
    skill: str
    isRequired: bool
    status: EvidenceStatus
    evidenceText: Optional[str] = None
    verificationQuestion: Optional[str] = None

class CriterionScoreBreakdown(BaseModel):
    requiredSkills: float = 0.0
    experience: float = 0.0
    projects: float = 0.0
    educationCerts: float = 0.0

class CandidateResultResponse(BaseModel):
    id: str
    ownerId: str
    screeningRunId: str
    jobId: str
    jobTitle: Optional[str] = None
    resumeId: str
    candidateName: str
    overallScore: float  # 0 - 100
    evaluationCoverage: float  # 0 - 100%
    evaluableCriteriaCount: int
    totalCriteriaCount: int
    criterionScores: CriterionScoreBreakdown
    skillGaps: List[SkillGapItem] = Field(default_factory=list)
    matchedRequirements: List[str] = Field(default_factory=list)
    missingRequirements: List[str] = Field(default_factory=list)
    unclearRequirements: List[str] = Field(default_factory=list)
    reviewStatus: ReviewStatus = ReviewStatus.NOT_REVIEWED
    recruiterNotes: str = ""
    processingWarnings: List[str] = Field(default_factory=list)
    extractedProfile: Optional[ExtractedProfile] = None
    methodologyNote: str = "Deterministic weighted model over evaluable criteria with coverage reporting."
    createdAt: str
    updatedAt: str

class ReviewStatusUpdate(BaseModel):
    reviewStatus: ReviewStatus
    recruiterNotes: Optional[str] = None


# --- Comparison Models ---

class CandidateComparisonRequest(BaseModel):
    jobId: str
    candidateResultIds: List[str] = Field(..., min_length=2, max_length=5)

class CandidateComparisonResponse(BaseModel):
    jobId: str
    jobTitle: str
    criteriaVersionConsistent: bool
    warningMessage: Optional[str] = None
    candidates: List[CandidateResultResponse]


# --- Interview Assistant Models ---

class InterviewQuestion(BaseModel):
    id: str
    category: QuestionCategory
    competency: str
    difficulty: QuestionDifficulty
    questionText: str
    relevanceReason: str
    candidateEvidence: Optional[str] = None
    expectedIndicators: List[str] = Field(default_factory=list)
    followUpProbes: List[str] = Field(default_factory=list)

class InterviewGenerateRequest(BaseModel):
    jobId: str
    candidateResultId: Optional[str] = None
    categories: Optional[List[QuestionCategory]] = None
    questionCount: int = Field(default=5, ge=1, le=15)
    targetDifficulty: QuestionDifficulty = QuestionDifficulty.MID

class InterviewQuestionSetResponse(BaseModel):
    id: str
    ownerId: str
    jobId: str
    jobTitle: str
    candidateResultId: Optional[str] = None
    candidateName: Optional[str] = None
    questions: List[InterviewQuestion]
    generationSource: str  # "LLM_ASSISTED" | "RULE_ENGINE_FALLBACK"
    createdAt: str


# --- Resume Quality Analyzer ---

class ResumeQualityFinding(BaseModel):
    category: str  # "VAGUE_CONTRIBUTION" | "UNMEASURED_ACHIEVEMENT" | "UNSUPPORTED_SKILL" | "AMBIGUOUS_DATE" | "CLARITY"
    severity: str  # "INFO" | "SUGGESTION" | "IMPROVEMENT"
    title: str
    observation: str
    constructiveFeedback: str
    relevantSnippet: Optional[str] = None

class ResumeQualityAnalysisResponse(BaseModel):
    resumeId: str
    candidateName: str
    presentationClarityScore: float  # 0 - 100 presentation clarity (NOT candidate ability)
    findings: List[ResumeQualityFinding]
    strengths: List[str]
    disclaimer: str = (
        "This analysis evaluates how clearly the resume is drafted and structured. "
        "It does NOT evaluate candidate competence or penalize career changes or nontraditional paths."
    )


# --- Analytics Models ---

class AnalyticsDashboardResponse(BaseModel):
    totalJobs: int
    totalResumes: int
    totalScreeningRuns: int
    candidatesAwaitingReview: int
    parsingSuccessCount: int
    parsingFailedCount: int
    scoreDistribution: Dict[str, int]  # "0-20", "21-40", "41-60", "61-80", "81-100"
    reviewStatusCounts: Dict[str, int]
    topSkillsDemanded: List[Dict[str, Any]]
    recentScreenings: List[Dict[str, Any]]


# --- Deletion Models ---

class DeletionScope(str, Enum):
    CANDIDATE_RESULT = "CANDIDATE_RESULT"
    RESUME_DOCUMENT = "RESUME_DOCUMENT"
    JOB_AND_RESULTS = "JOB_AND_RESULTS"
    FULL_ACCOUNT_DATA = "FULL_ACCOUNT_DATA"

class DeletionRequest(BaseModel):
    scope: DeletionScope
    resourceId: Optional[str] = None  # candidateResultId, resumeId, or jobId
    confirmationText: str = Field(..., description="Must equal 'DELETE'")

class DeletionResponse(BaseModel):
    success: bool
    scope: DeletionScope
    deletedItemsCount: int
    message: str
