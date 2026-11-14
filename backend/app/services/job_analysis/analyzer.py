import re
from typing import Dict, Any, List
from app.models.schemas import JobParseResponse, ScoringWeights
from app.services.matching.skill_normalizer import extract_known_skills_from_text

class JobDescriptionAnalyzer:
    """
    Parses unstructured job description text to suggest structured requirements,
    responsibilities, required skills, and balanced scoring weights.
    Recruiter can review and edit before saving.
    """

    @classmethod
    def parse_text(cls, raw_text: str) -> JobParseResponse:
        lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
        
        # 1. Title inference
        title = "Software Engineer"
        for l in lines[:5]:
            if any(term in l.lower() for term in ["engineer", "developer", "architect", "lead", "manager", "specialist", "analyst"]):
                title = re.sub(r'^(role|position|job title|title)\s*:\s*', '', l, flags=re.IGNORECASE).strip()
                break

        # 2. Department inference
        dept = "Engineering"
        lower_raw = raw_text.lower()
        if any(term in lower_raw for term in ["product", "product management"]):
            dept = "Product"
        elif any(term in lower_raw for term in ["data", "machine learning", "ai", "analytics"]):
            dept = "Data & AI"
        elif any(term in lower_raw for term in ["security", "infosec", "cyber"]):
            dept = "Security"
        elif any(term in lower_raw for term in ["design", "ui", "ux"]):
            dept = "Design"

        # 3. Minimum Experience
        exp_match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+relevant)?\s+experience', lower_raw)
        min_exp = float(exp_match.group(1)) if exp_match else 2.0

        # 4. Extract Skills
        all_skills = extract_known_skills_from_text(raw_text)
        req_skills = all_skills[:6] if len(all_skills) >= 6 else all_skills
        pref_skills = all_skills[6:10] if len(all_skills) > 6 else []

        # 5. Extract Responsibilities
        responsibilities = []
        in_resp = False
        for l in lines:
            l_lower = l.lower()
            if any(term in l_lower for term in ["responsibilities", "what you will do", "what you'll do", "key duties"]):
                in_resp = True
                continue
            if in_resp:
                if any(term in l_lower for term in ["requirements", "qualifications", "skills", "benefits", "what we offer"]):
                    in_resp = False
                    continue
                if l.startswith("•") or l.startswith("-") or l.startswith("*") or (len(l) > 20 and not l.endswith(":")):
                    responsibilities.append(l.lstrip("•-* ").strip())

        if not responsibilities:
            responsibilities = [
                f"Design, build, and deploy production-grade software aligned with team roadmaps.",
                f"Collaborate cross-functionally with product and engineering leaders.",
                f"Uphold code quality, testing standards, and operational resilience."
            ]

        # 6. Education & Certifications
        education = []
        if any(term in lower_raw for term in ["bachelor", "b.s", "b.tech", "degree in computer science"]):
            education.append("Bachelor's degree in Computer Science, Engineering, or related technical field (or equivalent practical experience)")
        if any(term in lower_raw for term in ["master", "m.s", "m.tech"]):
            education.append("Master's degree preferred")

        certifications = []
        for c in ["AWS", "Kubernetes", "GCP", "Azure", "PMP", "CISSP"]:
            if c.lower() in lower_raw:
                certifications.append(f"{c} Certification preferred")

        # Suggested Weights
        weights = ScoringWeights(
            requiredSkills=40.0,
            experience=25.0,
            projects=20.0,
            educationCerts=15.0
        )

        return JobParseResponse(
            title=title,
            department=dept,
            responsibilities=responsibilities[:6],
            requiredSkills=req_skills,
            preferredSkills=pref_skills,
            minExperienceYears=min_exp,
            educationRequirements=education,
            certifications=certifications,
            suggestedWeights=weights
        )
