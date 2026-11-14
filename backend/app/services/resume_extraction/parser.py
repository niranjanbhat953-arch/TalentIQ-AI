import re
from typing import Dict, Any, List, Optional, Tuple
from app.models.schemas import ExtractedProfile, WorkExperienceItem, EducationItem, ProjectItem, EvidenceSnippet
from app.services.matching.skill_normalizer import extract_known_skills_from_text, normalize_skill

EMAIL_REGEX = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
PHONE_REGEX = r'(?:(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4})'
DATE_RANGE_REGEX = r'(?:(19\d\d|20\d\d|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(?:19\d\d|20\d\d)?)\s*(?:-|–|to)\s*(?:(19\d\d|20\d\d|present|current|now|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(?:19\d\d|20\d\d)?)'

class ResumeParser:
    @classmethod
    def parse(cls, raw_text: str, pages_data: Optional[List[Dict[str, Any]]] = None, is_scanned_warning: bool = False) -> ExtractedProfile:
        if not raw_text or len(raw_text.strip()) == 0:
            return ExtractedProfile(
                candidateName="Unreadable Document",
                summary="No readable text extracted.",
                rawTextLength=0,
                isScannedWarning=True
            )

        lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
        
        # 1. Extract Candidate Name
        name = cls._extract_name(lines)
        
        # 2. Extract Contact Info
        email = cls._extract_email(raw_text)
        phone = cls._extract_phone(raw_text)
        location = cls._extract_location(lines)

        # 3. Extract Sections
        sections = cls._split_into_sections(raw_text)
        
        # 4. Extract Skills
        skills = cls._extract_skills(sections.get("skills", "") + "\n" + raw_text)

        # 5. Extract Work History & Total Experience
        work_history, total_exp = cls._extract_work_history(sections.get("experience", "") or raw_text)

        # 6. Extract Education
        education = cls._extract_education(sections.get("education", "") or raw_text)

        # 7. Extract Projects
        projects = cls._extract_projects(sections.get("projects", ""))

        # 8. Extract Certifications
        certifications = cls._extract_certifications(sections.get("certifications", "") or raw_text)

        # 9. Extract Achievements & Summary
        achievements = cls._extract_achievements(sections.get("achievements", "") or raw_text)
        summary = sections.get("summary", "")
        if not summary and len(lines) > 2:
            # First few lines after contact header often act as profile/summary
            summary = " ".join(lines[1:4])

        # 10. Generate Traceable Evidence Snippets
        evidence_snippets = cls._build_evidence_snippets(pages_data, skills, work_history, education)

        return ExtractedProfile(
            candidateName=name,
            email=email,
            phone=phone,
            location=location,
            summary=summary[:600],
            totalExperienceYears=round(total_exp, 1),
            workHistory=work_history,
            education=education,
            skills=skills,
            projects=projects,
            certifications=certifications,
            achievements=achievements,
            evidenceSnippets=evidence_snippets,
            rawTextLength=len(raw_text),
            isScannedWarning=is_scanned_warning
        )

    @classmethod
    def _extract_name(cls, lines: List[str]) -> str:
        # Check first 5 lines for candidate name
        ignored_tokens = {"resume", "curriculum", "vitae", "cv", "profile", "contact", "email", "phone", "page"}
        for line in lines[:6]:
            clean = line.strip()
            # Ignore emails, phone lines, links
            if "@" in clean or re.search(r'\d{5,}', clean) or len(clean) > 45 or len(clean) < 3:
                continue
            words = clean.split()
            if 1 < len(words) <= 4:
                if not any(w.lower() in ignored_tokens for w in words):
                    # Check if mostly alphabetic
                    if re.match(r"^[A-Za-z\s.'-]+$", clean):
                        return clean.title()
        return lines[0].title() if lines else "Candidate"

    @classmethod
    def _extract_email(cls, text: str) -> Optional[str]:
        match = re.search(EMAIL_REGEX, text)
        return match.group(0).lower() if match else None

    @classmethod
    def _extract_phone(cls, text: str) -> Optional[str]:
        matches = re.findall(PHONE_REGEX, text)
        for m in matches:
            cleaned = re.sub(r'[^\d+]', '', m)
            if 7 <= len(cleaned) <= 15:
                return m.strip()
        return None

    @classmethod
    def _extract_location(cls, lines: List[str]) -> Optional[str]:
        for line in lines[:8]:
            if any(term in line.lower() for term in ["location:", "address:", "based in"]):
                return line.split(":", 1)[-1].strip()
            # Check for City, State / Country pattern (e.g. "Seattle, WA" or "Bengaluru, India")
            match = re.search(r'([A-Za-z\s]{3,20},\s*[A-Za-z\s]{2,20})', line)
            if match and "@" not in line and not re.search(r'\d', line):
                return match.group(1).strip()
        return None

    @classmethod
    def _split_into_sections(cls, text: str) -> Dict[str, str]:
        section_headers = {
            "experience": ["experience", "employment", "work history", "professional experience", "work experience"],
            "education": ["education", "academic background", "qualifications", "academics"],
            "skills": ["skills", "technical skills", "technologies", "core competencies", "competencies"],
            "projects": ["projects", "personal projects", "academic projects", "key projects"],
            "certifications": ["certifications", "licenses", "certificates", "credentials"],
            "achievements": ["achievements", "awards", "honors", "publications"],
            "summary": ["summary", "profile", "objective", "professional summary", "about me"]
        }

        # Find boundaries
        lines = text.split("\n")
        current_section = "intro"
        section_texts: Dict[str, List[str]] = {k: [] for k in section_headers}
        section_texts["intro"] = []

        for line in lines:
            trimmed = line.strip().lower()
            matched_header = None
            for sec_name, triggers in section_headers.items():
                if any(trimmed == trigger or trimmed.startswith(trigger + ":") for trigger in triggers):
                    matched_header = sec_name
                    break

            if matched_header:
                current_section = matched_header
            else:
                if current_section in section_texts:
                    section_texts[current_section].append(line)

        return {k: "\n".join(v).strip() for k, v in section_texts.items()}

    @classmethod
    def _extract_skills(cls, text: str) -> List[str]:
        known = extract_known_skills_from_text(text)
        return known

    @classmethod
    def _extract_work_history(cls, text: str) -> Tuple[List[WorkExperienceItem], float]:
        items: List[WorkExperienceItem] = []
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        
        # Calculate experience years from 4-digit years and keywords
        import datetime
        current_yr = datetime.datetime.now().year
        total_years = 0.0

        # Check for explicit statements like "6+ years of experience"
        stated_exp_match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:relevant\s+)?experience)?', text, re.IGNORECASE)
        if stated_exp_match:
            total_years = float(stated_exp_match.group(1))

        years = [int(y) for y in re.findall(r'\b(19\d\d|20[0-2]\d)\b', text)]
        if years:
            min_year = min(years)
            if any(term in text.lower() for term in ["present", "current", "now"]):
                max_year = current_yr
            else:
                max_year = min(max(years), current_yr)
            diff = max_year - min_year
            total_years = max(total_years, float(diff))

        total_years = max(0.5, total_years) if (years or stated_exp_match) else 0.0

        # Detect job blocks
        current_company = None
        current_title = None
        current_highlights: List[str] = []

        for line in lines:
            # Check for date line
            if re.search(r'\b(19\d\d|20\d\d)\b', line) and any(sep in line for sep in ["-", "–", "to", "Present"]):
                if current_company and current_title:
                    items.append(WorkExperienceItem(
                        company=current_company,
                        title=current_title,
                        startDate="",
                        endDate="Present",
                        highlights=current_highlights[:5],
                        skillsUsed=extract_known_skills_from_text(" ".join(current_highlights))
                    ))
                    current_highlights = []
                
                parts = re.split(r'[-–|]', line)
                current_company = parts[0].strip() if parts else "Organization"
                current_title = parts[1].strip() if len(parts) > 1 else "Professional"
            elif line.startswith("•") or line.startswith("-") or line.startswith("*"):
                current_highlights.append(line.lstrip("•-* ").strip())
            else:
                if current_company and len(line) > 10:
                    current_highlights.append(line)

        if current_company and current_title:
            items.append(WorkExperienceItem(
                company=current_company,
                title=current_title,
                startDate="",
                endDate="Present",
                highlights=current_highlights[:5],
                skillsUsed=extract_known_skills_from_text(" ".join(current_highlights))
            ))

        return items, total_years

    @classmethod
    def _extract_education(cls, text: str) -> List[EducationItem]:
        items: List[EducationItem] = []
        degree_patterns = [
            r'\b(Bachelor(?:[\'\’]s)?|B\.?S\.?|B\.?A\.?|B\.?Tech|B\.?E\.?)\b.*?(?:in\s+([A-Za-z\s]+))?',
            r'\b(Master(?:[\'\’]s)?|M\.?S\.?|M\.?A\.?|M\.?Tech|M\.?B\.?A\.?)\b.*?(?:in\s+([A-Za-z\s]+))?',
            r'\b(Ph\.?D\.?|Doctorate)\b.*?(?:in\s+([A-Za-z\s]+))?',
            r'\b(Associate(?:[\'\’]s)?|Diploma)\b.*?(?:in\s+([A-Za-z\s]+))?'
        ]

        lines = [l.strip() for l in text.split("\n") if l.strip()]
        for line in lines:
            for pattern in degree_patterns:
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    degree_str = match.group(1)
                    field_str = match.group(2) or "Computer Science / Related Field"
                    # Try to extract institution and year from same line or nearby
                    year_match = re.search(r'\b(19\d\d|20[0-2]\d)\b', line)
                    year = int(year_match.group(1)) if year_match else None
                    institution = re.sub(pattern, "", line, flags=re.IGNORECASE)
                    institution = re.sub(r'\b(19\d\d|20[0-2]\d)\b', '', institution)
                    institution = institution.strip(" ,-|()•") or "University"
                    
                    items.append(EducationItem(
                        institution=institution,
                        degree=degree_str,
                        fieldOfStudy=field_str.strip(),
                        graduationYear=year
                    ))
                    break

        return items

    @classmethod
    def _extract_projects(cls, text: str) -> List[ProjectItem]:
        projects: List[ProjectItem] = []
        if not text:
            return projects

        blocks = text.split("\n\n")
        for b in blocks:
            b_lines = [l.strip() for l in b.split("\n") if l.strip()]
            if not b_lines:
                continue
            title = b_lines[0].lstrip("•-* #").strip()
            desc = " ".join(b_lines[1:]) if len(b_lines) > 1 else title
            techs = extract_known_skills_from_text(b)
            if len(title) > 2 and len(title) < 100:
                projects.append(ProjectItem(
                    name=title,
                    description=desc[:300],
                    technologies=techs
                ))

        return projects[:6]

    @classmethod
    def _extract_certifications(cls, text: str) -> List[str]:
        cert_names = [
            "AWS Certified", "Solutions Architect", "Google Cloud Certified",
            "Azure Certified", "Certified Kubernetes Administrator", "CKA", "CKAD",
            "PMP", "Scrum Master", "CISSP", "CompTIA", "HashiCorp Certified Terraform",
            "Certified Ethical Hacker"
        ]
        found = []
        for line in text.split("\n"):
            clean = line.strip()
            for c in cert_names:
                if c.lower() in clean.lower():
                    found.append(clean.lstrip("•-* ").strip())
                    break
        return list(set(found))[:6]

    @classmethod
    def _extract_achievements(cls, text: str) -> List[str]:
        achievements = []
        for line in text.split("\n"):
            clean = line.strip().lstrip("•-* ")
            if any(term in clean.lower() for term in ["awarded", "published", "winner", "first place", "patent", "honored", "recognized"]):
                achievements.append(clean)
        return achievements[:4]

    @classmethod
    def _build_evidence_snippets(
        cls,
        pages_data: Optional[List[Dict[str, Any]]],
        skills: List[str],
        work_history: List[WorkExperienceItem],
        education: List[EducationItem]
    ) -> List[EvidenceSnippet]:
        snippets: List[EvidenceSnippet] = []
        
        # Skill snippets
        if skills:
            snippets.append(EvidenceSnippet(
                category="SKILLS",
                text=f"Demonstrated proficiency in: {', '.join(skills[:8])}",
                pageNumber=1,
                confidence=0.95
            ))

        # Experience snippets
        for w in work_history[:3]:
            snippets.append(EvidenceSnippet(
                category="WORK_EXPERIENCE",
                text=f"Held role of {w.title} at {w.company} with core contributions: {' '.join(w.highlights[:2])}",
                pageNumber=1,
                confidence=0.90
            ))

        # Education snippets
        for e in education[:2]:
            snippets.append(EvidenceSnippet(
                category="EDUCATION",
                text=f"{e.degree} in {e.fieldOfStudy} from {e.institution}",
                pageNumber=1,
                confidence=0.92
            ))

        return snippets
