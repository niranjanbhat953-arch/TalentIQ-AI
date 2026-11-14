# TalentIQ AI — Recruitment Intelligence Platform

> **Beyond Resumes. Discover Potential.**  
> Explainable, evidence-based AI recruitment intelligence SaaS.

[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript%20%7C%20Vite-blue)](frontend/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.11-green)](backend/)
[![Database](https://img.shields.io/badge/Database-Firestore%20%7C%20Local%20JSON-orange)](backend/app/core/database.py)
[![Auth](https://img.shields.io/badge/Auth-Firebase%20JWT-red)](backend/app/core/security.py)

---

## Product Overview

TalentIQ AI is a full-stack, production-grade AI recruitment intelligence platform that empowers recruiters with:

- **Explainable Candidate Scoring** — transparent weighted alignment across 4 evaluable criteria
- **Evidence-Traceable Skill Gap Matrix** — Found / Partially Supported / Unclear / Not Detected / Unevaluable
- **Dynamic Weight Renormalization** — no division-by-zero; weights redistribute across evaluable sections only
- **Bulk PDF/DOCX Resume Processing** — PyMuPDF extraction with scanned-doc detection + SHA-256 dedup
- **Interview Question Generator** — competency-based, tied to detected skill gaps and candidate projects
- **Resume Quality Auditor** — ATS score, contact completeness, section coverage, action-verb density
- **Side-by-Side Candidate Comparison** — radar chart, dimension diffs, ranked evidence snippets
- **CSV & PDF Export** — sanitized (formula injection protection) report downloads
- **Pipeline Analytics** — score distribution histograms, review funnel, top skills demanded
- **Responsible AI by Design** — zero automatic rejection, protected-characteristics-blind scoring

---

## Architecture

```
TalentIQ AI/
├── frontend/          # React 18 + TypeScript + Vite + Tailwind CSS v3
│   └── src/
│       ├── pages/     # 15 full-featured page components
│       ├── components/ # Layout, Auth guards
│       ├── context/   # AuthContext (Firebase + demo token)
│       ├── lib/       # api.ts (API client), firebase.ts
│       └── types/     # Shared TypeScript interfaces
├── backend/           # Python FastAPI + Uvicorn
│   └── app/
│       ├── api/v1/endpoints/   # 10 REST endpoint modules
│       ├── core/               # config.py, database.py, security.py
│       ├── models/             # Pydantic schemas (schemas.py)
│       └── services/
│           ├── document_processing/  # PyMuPDF + python-docx extractor
│           ├── resume_extraction/    # Resume parser + quality analyzer
│           ├── matching/             # Deterministic alignment engine
│           ├── interviews/           # Interview question generator
│           └── reports/              # CSV + PDF export service
└── docs/              # PRD, Data Model, API Spec, Security, Test Plan
```

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.11
- (Optional) Firebase project for production auth

### 1. Start the Backend

```powershell
# From TalentIQ AI/backend:
.\venv\Scripts\Activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend API: http://localhost:8000  
Interactive Docs: http://localhost:8000/api/docs  
OpenAPI Schema: http://localhost:8000/api/openapi.json

### 2. Start the Frontend

```powershell
# From TalentIQ AI/frontend:
npm run dev
```

Frontend: http://localhost:5173

### 3. Sign In

- **Demo Mode** (no Firebase needed): Click **"Sign In as Demo Recruiter"** on the sign-in page
- **Production**: Configure Firebase credentials (see Environment Configuration below)

---

## Environment Configuration

### Frontend — `frontend/.env.local`

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=1:your_sender_id:web:your_app_id
```

### Backend — `backend/.env`

```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CREDENTIALS_PATH=/path/to/serviceAccountKey.json
ENVIRONMENT=development
DEBUG=true
ALLOWED_ORIGINS=http://localhost:5173
MAX_UPLOAD_SIZE_MB=15
```

> **Local Development**: Without `.env`, the backend runs with a local JSON database (`backend/storage/local_db.json`) and accepts `dev-token-{uid}` authorization headers for testing.

---

## API Reference

All API endpoints at `/api/v1/`. Full OpenAPI spec at `/api/docs`.

| Endpoint | Method | Description |
|---|---|---|
| `/auth/me` | GET | Get current user profile |
| `/auth/sync` | POST | Sync Firebase user to backend |
| `/jobs` | GET/POST | List/create job postings |
| `/jobs/{id}` | GET/PUT/DELETE | Get/update/delete job |
| `/jobs/{id}/archive` | PATCH | Toggle archive status |
| `/resumes/upload` | POST | Bulk upload PDF/DOCX resumes |
| `/resumes/{id}/quality-analysis` | GET | Run resume quality audit |
| `/screening/runs` | GET/POST | List/create screening runs |
| `/screening/runs/{id}/results` | GET | Get ranked candidate results |
| `/candidates/{id}` | GET | Get candidate scorecard |
| `/candidates/{id}/review` | PATCH | Update recruiter review status |
| `/candidates/compare` | POST | Side-by-side comparison |
| `/interviews/generate` | POST | Generate interview questions |
| `/analytics/dashboard` | GET | Pipeline analytics data |
| `/reports/csv/{runId}` | GET | Download CSV report |
| `/reports/pdf/{resultId}` | GET | Download PDF candidate report |
| `/settings` | GET/PUT | Recruiter settings |
| `/settings/delete-data` | POST | GDPR data deletion |

**Authentication**: All protected endpoints require `Authorization: Bearer <firebase_id_token>` header.  
**Dev token format**: `dev-token-{your_uid}` (local dev only).

---

## Scoring Methodology

TalentIQ AI uses a **deterministic, weighted alignment algorithm** (not a black-box ML model):

| Criterion | Default Weight | Evaluable When |
|---|---|---|
| Required Skills | 40% | Job has ≥1 required skill |
| Relevant Experience | 25% | Min experience > 0 or profile has dates |
| Relevant Projects | 20% | Resume has project section |
| Education & Certs | 15% | Job or candidate has education data |

**Dynamic Renormalization**: If a criterion cannot be evaluated (e.g., no projects section in resume), its weight is redistributed proportionally among evaluable criteria. This prevents unfair score deflation.

**Score Range**: 0–100. No automatic rejections. All outputs labeled as **Decision Support Only**.

---

## Responsible AI Principles

1. **Zero Automatic Rejection** — TalentIQ AI never rejects candidates. All decisions require human recruiter review.
2. **Protected Characteristics Blind** — Names, gender, age, nationality, and physical characteristics never influence scores.
3. **Missing Evidence ≠ Absence of Skill** — Unverified criteria are labeled "Not Detected" or "Unclear," not penalized as definitive gaps.
4. **Auditable Evidence Traceability** — Every score is backed by a text quote and page number from the resume.
5. **Transparent Methodology** — Every scorecard includes a full `methodologyNote` explaining the exact formula used.
6. **Zero-Trust Server Authorization** — All data is scoped to the verified token owner. Client-supplied IDs are never trusted.

---

## Running Tests

```powershell
# Backend tests
cd backend
.\venv\Scripts\Activate
pytest tests/ -v

# Frontend tests
cd frontend
npm test
```

---

## Documentation

| Document | Description |
|---|---|
| [PRD.md](docs/PRD.md) | Product Requirements Document |
| [DATA_MODEL.md](docs/DATA_MODEL.md) | Firestore collection schemas |
| [API.md](docs/API.md) | REST API specification |
| [SECURITY.md](docs/SECURITY.md) | Security & Responsible AI architecture |
| [TEST_PLAN.md](docs/TEST_PLAN.md) | Backend + frontend test strategy |

---

## Technology Stack

**Frontend**
- React 18 + TypeScript
- Vite 8 (build tool)
- Tailwind CSS v3 (dark glassmorphism design system)
- React Router v6
- TanStack Query v5
- Recharts (analytics charts)
- Framer Motion (animations)
- React Hook Form + Zod (form validation)
- Firebase Auth SDK

**Backend**
- Python 3.11 + FastAPI
- Uvicorn (ASGI server)
- Pydantic v2 (data validation)
- Firebase Admin SDK (auth verification)
- PyMuPDF (PDF extraction)
- python-docx (DOCX extraction)
- scikit-learn (cosine similarity for skill matching)
- ReportLab (PDF report generation)
- pytest (testing)

---

© 2026 TalentIQ AI — Decision Support Architecture. Not a hiring decision engine.
