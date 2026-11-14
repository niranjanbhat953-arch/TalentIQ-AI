# TalentIQ AI - Security, Privacy & Responsible AI Architecture

## 1. Zero-Trust Server-Side Authorization
- **Independent Token Verification**: The backend verifies every Firebase ID Token using Firebase Admin SDK or Google cryptographic public key certificate verification.
- **Strict Ownership Checks**: Every Firestore query and document read/write explicitly enforces `where("ownerId", "==", current_user.uid)`. Client-supplied user IDs are NEVER trusted as proof of ownership.
- **Cross-Tenant Isolation**: Automated tests verify that User A cannot read, modify, or delete User B's jobs, resumes, candidate results, or recruiter notes.

## 2. Responsible AI & Fair Recruitment Principles
- **Decision-Support Ethos**: TalentIQ AI is an explainable decision-support tool. It never automatically rejects candidates based on an AI score. Human recruiters retain full authority over hiring decisions.
- **Non-Protected Attributes**: The matching engine explicitly ignores candidate names, gender, age, photographs, addresses, nationality, ethnicity, religion, disability, and marital status. Scoring is based strictly on demonstrable skills, relevant experience duration, project evidence, and verified education/certifications.
- **Traceable Evidence & Uncertainty Awareness**: Every score has an associated evaluation coverage metric and clear categorizations: *Found*, *Partially Supported*, *Unclear*, *Not Detected*, or *Unevaluable*.
- **Missing Evidence Principle**: The system explicitly notes: *"Missing resume evidence does not prove a candidate lacks a qualification."*

## 3. Secure Document Handling
- **Private Storage**: Resumes are stored in private local/cloud storage and are NEVER served via public URLs.
- **Input Validation**: All incoming files undergo MIME-type inspection, extension verification, magic bytes verification, and a 15MB size ceiling.
- **Safe Temporary Files**: Temporary files used for OCR and text extraction are cleaned up immediately inside `finally` blocks.
- **Duplicate Prevention**: SHA-256 content hashing detects duplicate resumes before triggering redundant parsing workloads.

## 4. Export & Data Protection
- **CSV Formula Injection Mitigation**: Any value exported into CSV files that begins with dangerous spreadsheet execution symbols (`=`, `+`, `-`, `@`, `\t`, `\r`) is prefixed with a single apostrophe (`'`) to neutralize formula injection in Microsoft Excel and Google Sheets.
- **GDPR & DPDP Compliance**: Complete deletion flows allow recruiters to purge candidate resumes, extracted text, matching results, and full account data upon request.
- **Operational Log Sanitization**: Routine application logs never dump full resume texts, PII, or raw tokens.
