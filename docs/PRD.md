# TalentIQ AI - Product Requirements Document (PRD)

## Brand Vision & Philosophy
**Tagline**: *Beyond Resumes. Discover Potential.*

TalentIQ AI is an explainable, evidence-based AI recruitment intelligence SaaS platform designed to support human recruiters in evaluating candidate alignment with job descriptions. It is built strictly as a **recruitment decision-support system, not an autonomous hiring authority**. Under no circumstance does TalentIQ AI automatically reject candidates solely based on an AI score.

---

## Core Product Capabilities

1. **Job Description & Criteria Management**
   - Rich CRUD operations for role definitions: responsibilities, required skills, preferred skills, minimum years of experience, education, certifications, custom evaluation criteria, and scoring weights.
   - Versioned evaluation criteria: each screening run captures a frozen snapshot of the criteria version and scoring weights to ensure historical reproducibility and auditability.
   - AI/Rule-based Job Description Parser: extracts structured criteria and suggests evaluation weights with recruiter review and override.

2. **Secure Document Processing & Evidence Extraction**
   - Bulk upload of PDF and DOCX candidate resumes.
   - Robust document parsing via PyMuPDF (`fitz`) and `python-docx`.
   - File validation (MIME, magic bytes, size limits up to 15MB).
   - Duplicate detection via SHA-256 content hashing.
   - Scanned PDF detection (detecting insufficient extractable text layers).
   - Traceable structured extraction: Candidate Name, Contact, Education, Work History, Job Titles, Skills, Projects, Certifications, and Achievements.
   - Evidence categorization: *Found*, *Partially Supported*, *Unclear*, *Not Detected*, and *Unevaluable*.

3. **Deterministic & Explainable AI Matching Engine**
   - Default balanced scoring weights:
     - Required Skill Alignment: 40%
     - Relevant Experience: 25%
     - Relevant Projects: 20%
     - Education & Certifications: 15%
     - Total: 100% (Configurable per job)
   - Dynamic Weight Renormalization: handles unevaluable criteria cleanly by redistributing weights over evaluable criteria without division-by-zero or deflated candidate scores.
   - Evaluation Coverage metric: reports how much of the job requirement set had measurable evidence in the submitted resume.
   - Semantic similarity via Sentence Embeddings / TF-IDF Vector Space & rule-based skill alias normalization (e.g. "ReactJS" = "React", "K8s" = "Kubernetes", "Postgres" = "PostgreSQL").
   - Explicit disclaimer: "Similarity is not proof of proficiency. Missing resume evidence does not prove a candidate lacks a skill."

4. **Candidate Review & Comparison Workflows**
   - Searchable, filterable, sortable candidate table with evaluation coverage, alignment score, and review status.
   - Recruiter review status state machine:
     - `NOT_REVIEWED` (Default)
     - `IN_REVIEW`
     - `SHORTLISTED`
     - `NEEDS_VERIFICATION`
     - `NOT_PROCEEDING`
   - Detailed candidate breakdown view: skill gap matrix, evidence snippets, recruiter notes, and raw document preview.
   - Multi-candidate comparison view (2 to 5 candidates for the same job) with side-by-side criteria breakdown and compatibility verification.

5. **Recruitment Intelligence Modules**
   - **Interview Assistant**: generates competency-based, technical, behavioral, and role-scenario interview questions tailored to the candidate's skill gaps and highlighted projects with scoring rubrics and follow-up probes.
   - **Resume Quality Analyzer**: evaluates structural clarity, vague technical contributions, lack of metrics, and unevidenced skill declarations without penalizing career transitions, employment gaps, or personal background.
   - **Real-Time Analytics**: live pipeline metrics computed from stored records (score distributions, skill demand, review pipeline funnels, parser reliability).
   - **Screening History**: immutable historical records of all screening runs with exact criteria version and score reproducibility.

6. **Reporting, Export & Privacy Management**
   - Sanitized CSV export with formula injection mitigation (prefixing dangerous characters `=`, `+`, `-`, `@`).
   - Structured printable PDF reports for candidate dossiers and screening audits.
   - Full GDPR/DPDP-compliant data deletion workflows for documents, parsed text, candidates, and user accounts.
