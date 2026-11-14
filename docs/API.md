# TalentIQ AI - REST API Specification (`/api/v1`)

All endpoints require a valid Firebase ID Token in the `Authorization: Bearer <token>` header, except for public health check and landing/metadata endpoints. Every protected resource strictly validates resource ownership: recruiters can only read and mutate their own jobs, resumes, candidate results, and reports.

---

## Base URL
`/api/v1`

---

## Endpoints Summary

### 1. System & Authentication
- `GET /health`: System status, environment check, database connectivity check.
- `GET /auth/me`: Current authenticated user profile derived from the verified Firebase token.
- `POST /auth/sync`: Sync/initialize user profile in Firestore upon first sign-in.

### 2. Jobs Management
- `GET /jobs`: List all jobs for the authenticated recruiter (with pagination, status filter, search).
- `POST /jobs`: Create a new job description with scoring weights and criteria.
- `GET /jobs/{job_id}`: Retrieve full details of a specific job.
- `PUT /jobs/{job_id}`: Update job criteria (increments `criteriaVersion` to protect historical runs).
- `PATCH /jobs/{job_id}/archive`: Toggle archive status for a job.
- `DELETE /jobs/{job_id}`: Delete a job and manage associated data dependencies.
- `POST /jobs/parse-description`: AI/Rule-based analyzer that takes raw job description text and suggests structured requirements, responsibilities, and scoring weights.

### 3. Resumes & Document Processing
- `POST /resumes/upload`: Multi-part bulk upload of PDF/DOCX resumes. Validates MIME, size, magic bytes, computes SHA-256 hash, and initiates background parsing.
- `GET /resumes`: List resumes belonging to recruiter (filterable by `job_id`, status).
- `GET /resumes/{resume_id}`: Get structured extraction details, evidence snippets, and raw text stats.
- `POST /resumes/{resume_id}/retry`: Re-queue a failed resume extraction.
- `DELETE /resumes/{resume_id}`: Delete resume file, parsed text, and associated data.

### 4. Screening Runs & AI Matching
- `POST /screening/runs`: Start a new screening run for a job against a set of resume IDs (or all un-screened resumes for the job). Generates background processing task.
- `GET /screening/runs`: List screening runs for a job or recruiter.
- `GET /screening/runs/{run_id}`: Get status and progress of a screening run.
- `GET /screening/runs/{run_id}/results`: Get all candidate alignment scores, coverage, and skill gaps for this run.

### 5. Candidate Results & Review Management
- `GET /candidates/{result_id}`: Detailed candidate scorecard, criterion breakdown, skill-gap matrix, evidence snippets, and recruiter notes.
- `PATCH /candidates/{result_id}/review`: Update recruiter review status (`SHORTLISTED`, `IN_REVIEW`, `NEEDS_VERIFICATION`, `NOT_PROCEEDING`) and add private notes.
- `POST /candidates/compare`: Compare 2 to 5 candidates for the same job side-by-side, verifying criteria version compatibility.

### 6. Interview Assistant
- `POST /interviews/generate`: Generate customized, competency-based interview questions with expected indicators and rubrics. Can be role-only or candidate-evidence-specific.
- `GET /interviews/{job_id}`: Retrieve saved interview question sets for a job.

### 7. Resume Quality Analyzer
- `POST /resumes/quality-analysis`: Analyze resume presentation clarity, unquantified claims, vague descriptions, and missing metrics without penalizing nontraditional backgrounds.

### 8. Analytics & Reporting
- `GET /analytics/dashboard`: Live recruiter pipeline metrics (score distributions, skill demand, review status breakdown, parsing success/failure counts).
- `GET /reports/csv/{run_id}`: Export screening results as a sanitized CSV file (formula-injection protected).
- `GET /reports/pdf/{result_id}`: Generate a printable candidate evaluation report.

### 9. Settings & Privacy / Deletion
- `GET /settings`: Recruiter preferences and default scoring weights.
- `PUT /settings`: Update preferences.
- `POST /settings/delete-data`: Comprehensive deletion workflow (purge resumes, extracted text, results, or full account data).
