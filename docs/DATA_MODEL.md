# TalentIQ AI - Data Model Specification

## Storage Architecture
TalentIQ AI leverages Google Cloud Firestore as its primary document store, with backend server-side authorization enforcement via Firebase Admin SDK. Every entity is bound to an `owner_id` (the authenticated recruiter's UID).

---

## Collections & Schemas

### 1. `users`
- `id`: string (Firebase Auth UID)
- `email`: string
- `displayName`: string
- `photoUrl`: string | null
- `organization`: string | null
- `role`: string ("recruiter" | "hiring_manager" | "admin")
- `createdAt`: ISO 8601 timestamp
- `updatedAt`: ISO 8601 timestamp
- `settings`: object
  - `defaultWeights`: { requiredSkills: 40, experience: 25, projects: 20, educationCerts: 15 }
  - `autoArchiveDays`: number (e.g. 90)
  - `llmProvider`: string ("rule_engine" | "gemini" | "openai")

### 2. `jobs`
- `id`: string (UUID or auto-generated ID)
- `ownerId`: string (Firebase Auth UID)
- `title`: string
- `department`: string
- `location`: string
- `employmentType`: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "REMOTE" | "HYBRID"
- `status`: "DRAFT" | "ACTIVE" | "ARCHIVED" | "CLOSED"
- `description`: string
- `responsibilities`: string[]
- `requiredSkills`: string[]
- `preferredSkills`: string[]
- `minExperienceYears`: number
- `educationRequirements`: string[]
- `certifications`: string[]
- `customCriteria`: Array<{ id: string; name: string; weight: number; description: string }>
- `scoringWeights`: {
    requiredSkills: number;
    experience: number;
    projects: number;
    educationCerts: number;
  }
- `criteriaVersion`: number (incremented on edit)
- `createdAt`: ISO 8601 timestamp
- `updatedAt`: ISO 8601 timestamp

### 3. `resumes`
- `id`: string (UUID)
- `ownerId`: string
- `jobId`: string | null
- `fileName`: string
- `fileSize`: number (bytes)
- `fileHash`: string (SHA-256 for duplicate detection)
- `mimeType`: string ("application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
- `storagePath`: string (private storage identifier)
- `processingStatus`: "PENDING" | "PROCESSING" | "EXTRACTED" | "FAILED"
- `errorMessage`: string | null
- `extractedProfile`: object
  - `candidateName`: string
  - `email`: string | null
  - `phone`: string | null
  - `location`: string | null
  - `summary`: string
  - `totalExperienceYears`: number
  - `workHistory`: Array<{
      company: string;
      title: string;
      startDate: string;
      endDate: string | "Present";
      highlights: string[];
      skillsUsed: string[];
    }>
  - `education`: Array<{
      institution: string;
      degree: string;
      fieldOfStudy: string;
      graduationYear: number | null;
    }>
  - `skills`: string[]
  - `projects`: Array<{
      name: string;
      description: string;
      technologies: string[];
      link: string | null;
    }>
  - `certifications`: string[]
  - `evidenceSnippets`: Array<{
      category: string;
      text: string;
      pageNumber: number | null;
      confidence: number;
    }>
- `uploadedAt`: ISO 8601 timestamp

### 4. `screeningRuns`
- `id`: string (UUID)
- `ownerId`: string
- `jobId`: string
- `jobTitle`: string
- `criteriaVersion`: number
- `scoringWeights`: object (frozen snapshot)
- `matchingModel`: string ("sentence-transformers/all-MiniLM-L6-v2 + rule-norm-v1")
- `totalSubmitted`: number
- `totalProcessed`: number
- `totalFailed`: number
- `status`: "QUEUED" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED"
- `startedAt`: ISO 8601 timestamp
- `completedAt`: ISO 8601 timestamp | null

### 5. `candidateResults`
- `id`: string (UUID)
- `ownerId`: string
- `screeningRunId`: string
- `jobId`: string
- `resumeId`: string
- `candidateName`: string
- `overallScore`: number (0 - 100)
- `evaluationCoverage`: number (0 - 100%)
- `evaluableCriteriaCount`: number
- `totalCriteriaCount`: number
- `criterionScores`: {
    requiredSkills: number;
    experience: number;
    projects: number;
    educationCerts: number;
  }
- `skillGaps`: Array<{
    skill: string;
    isRequired: boolean;
    status: "FOUND" | "PARTIALLY_SUPPORTED" | "UNCLEAR" | "NOT_DETECTED" | "UNEVALUABLE";
    evidenceText: string | null;
    verificationQuestion: string | null;
  }>
- `matchedRequirements`: string[]
- `missingRequirements`: string[]
- `reviewStatus`: "NOT_REVIEWED" | "IN_REVIEW" | "SHORTLISTED" | "NEEDS_VERIFICATION" | "NOT_PROCEEDING"
- `recruiterNotes`: string
- `processingWarnings`: string[]
- `createdAt`: ISO 8601 timestamp
- `updatedAt`: ISO 8601 timestamp

### 6. `interviewQuestionSets`
- `id`: string (UUID)
- `ownerId`: string
- `jobId`: string
- `candidateResultId`: string | null
- `candidateName`: string | null
- `questions`: Array<{
    id: string;
    category: "TECHNICAL" | "PROBLEM_SOLVING" | "PROJECT_DEEP_DIVE" | "BEHAVIORAL" | "ROLE_SCENARIO";
    competency: string;
    difficulty: "JUNIOR" | "MID" | "SENIOR" | "LEAD";
    questionText: string;
    relevanceReason: string;
    candidateEvidence: string | null;
    expectedIndicators: string[];
    followUpProbes: string[];
  }>
- `generationSource`: "LLM_ASSISTED" | "RULE_ENGINE_FALLBACK"
- `createdAt`: ISO 8601 timestamp

### 7. `activityLogs`
- `id`: string
- `ownerId`: string
- `action`: string
- `resourceType`: string
- `resourceId`: string
- `timestamp`: ISO 8601 timestamp
- `metadata`: object (no sensitive resume PII stored)
