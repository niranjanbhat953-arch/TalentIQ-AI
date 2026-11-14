# TalentIQ AI - Test Plan

## 1. Overview
This test plan validates functional correctness, security isolation, document extraction integrity, explainable scoring accuracy, and user experience for TalentIQ AI.

## 2. Backend Automated Test Suite (Pytest)
- **Authentication & Authorization (`tests/test_auth.py`)**:
  - Valid token verification produces user session.
  - Invalid/expired token rejects with 401 Unauthorized.
  - Missing token rejects with 401 Unauthorized.
- **Resource Ownership & Cross-Tenant Security (`tests/test_security_isolation.py`)**:
  - User A cannot access User B's job.
  - User A cannot upload resumes to User B's job.
  - User A cannot view User B's candidate results or private notes.
  - User A cannot delete User B's resources.
- **Document Processing & Validation (`tests/test_document_processing.py`)**:
  - Valid PDF parsing extracts readable text.
  - Valid DOCX parsing extracts structured paragraphs and tables.
  - Corrupt/empty documents trigger clear diagnostic errors without crashing.
  - Duplicate detection by SHA-256 hash correctly flags existing files.
  - File size and unsupported MIME types rejected with 422/400.
- **AI Matching Engine & Scoring Methodology (`tests/test_matching_engine.py`)**:
  - Deterministic scoring: identical inputs produce identical scores.
  - Weight re-normalization: unevaluable criteria are properly excluded without division-by-zero.
  - Evaluation coverage percentage calculation matches observed evidence.
  - Skill normalization correctly maps aliases (e.g., "K8s" -> "Kubernetes").
  - Missing evidence is labeled `NOT_DETECTED`, not penalized as negative score.
- **Reporting & CSV Injection Mitigation (`tests/test_reports.py`)**:
  - CSV export sanitizes fields beginning with `=`, `+`, `-`, `@`.
  - PDF generation produces valid PDF byte stream with candidate scorecard.
- **Data Deletion Workflows (`tests/test_data_deletion.py`)**:
  - Deletion of candidate removes parsed text and associated results.
  - Account deletion purges all user-owned jobs, resumes, and screening runs.

## 3. Frontend Automated Test Suite (Vitest + React Testing Library)
- **Routing & Navigation**: Protected route redirection when unauthenticated.
- **Job Creation Form**: Validation of required fields and dynamic scoring weights summing to 100%.
- **Screening Results Component**: Renders alignment score, coverage badge, and evidence breakdown.
- **Review Status Controls**: Recruiter status update triggers mutation and state refresh.
- **Candidate Comparison**: Compares multiple candidates and warns when criteria versions differ.
