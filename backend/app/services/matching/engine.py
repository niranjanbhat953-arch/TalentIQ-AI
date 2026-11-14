import math
import logging
from typing import Dict, Any, List, Tuple, Optional
from app.models.schemas import (
    ScoringWeights, ExtractedProfile, CandidateResultResponse,
    CriterionScoreBreakdown, SkillGapItem, EvidenceStatus, ReviewStatus
)
from app.services.matching.skill_normalizer import (
    normalize_skill, match_skill_presence, extract_known_skills_from_text
)

logger = logging.getLogger(__name__)

class MatchingEngine:
    """
    Deterministic, explainable matching engine with weight renormalization
    over evaluable criteria and coverage tracking.
    """

    @classmethod
    def evaluate_candidate(
        cls,
        job_data: Dict[str, Any],
        profile: ExtractedProfile,
        custom_weights: Optional[ScoringWeights] = None
    ) -> Dict[str, Any]:
        """
        Executes the 12-step matching pipeline.
        Returns candidate result evaluation dictionary.
        """
        # Step 1: Load criteria & weights
        job_weights = custom_weights or ScoringWeights(**(job_data.get("scoringWeights") or {}))
        required_skills = [s.strip() for s in job_data.get("requiredSkills", []) if s.strip()]
        preferred_skills = [s.strip() for s in job_data.get("preferredSkills", []) if s.strip()]
        min_experience_years = float(job_data.get("minExperienceYears", 0.0))
        education_reqs = [e.strip() for e in job_data.get("educationRequirements", []) if e.strip()]
        cert_reqs = [c.strip() for c in job_data.get("certifications", []) if c.strip()]
        responsibilities = job_data.get("responsibilities", [])

        # Build candidate full text representation for holistic context search
        candidate_text_parts = [
            profile.summary,
            " ".join(profile.skills),
            " ".join(w.title + " " + w.company + " " + " ".join(w.highlights) for w in profile.workHistory),
            " ".join(p.name + " " + p.description for p in profile.projects),
            " ".join(e.degree + " " + e.fieldOfStudy + " " + e.institution for e in profile.education),
            " ".join(profile.certifications)
        ]
        candidate_full_text = " ".join(candidate_text_parts)

        # Step 2 & 3 & 4: Skill Matching & Evidence Classification
        skill_gaps: List[SkillGapItem] = []
        matched_requirements: List[str] = []
        missing_requirements: List[str] = []
        unclear_requirements: List[str] = []

        matched_req_skills_count = 0
        total_required_skills = len(required_skills)

        for req_skill in required_skills:
            matched, canonical = match_skill_presence(req_skill, profile.skills, candidate_full_text)
            if matched:
                matched_req_skills_count += 1
                matched_requirements.append(f"Required Skill: {canonical}")
                skill_gaps.append(SkillGapItem(
                    skill=canonical,
                    isRequired=True,
                    status=EvidenceStatus.FOUND,
                    evidenceText=f"Verified presence of '{canonical}' in candidate profile/experience history.",
                    verificationQuestion=None
                ))
            else:
                missing_requirements.append(f"Required Skill: {req_skill}")
                skill_gaps.append(SkillGapItem(
                    skill=normalize_skill(req_skill),
                    isRequired=True,
                    status=EvidenceStatus.NOT_DETECTED,
                    evidenceText=None,
                    verificationQuestion=f"Can you describe your practical experience working with {req_skill} in production?"
                ))

        # Check preferred skills
        for pref_skill in preferred_skills:
            matched, canonical = match_skill_presence(pref_skill, profile.skills, candidate_full_text)
            if matched:
                matched_requirements.append(f"Preferred Skill: {canonical}")
                skill_gaps.append(SkillGapItem(
                    skill=canonical,
                    isRequired=False,
                    status=EvidenceStatus.FOUND,
                    evidenceText=f"Found preferred skill '{canonical}'.",
                    verificationQuestion=None
                ))
            else:
                skill_gaps.append(SkillGapItem(
                    skill=normalize_skill(pref_skill),
                    isRequired=False,
                    status=EvidenceStatus.NOT_DETECTED,
                    evidenceText=None,
                    verificationQuestion=None
                ))

        # Criterion 1: Skill Score
        if total_required_skills > 0:
            skill_score = (matched_req_skills_count / total_required_skills) * 100.0
            is_skill_evaluable = True
        else:
            skill_score = 100.0 if len(profile.skills) > 0 else 50.0
            is_skill_evaluable = False

        # Criterion 2: Relevant Experience Score
        # Compare profile.totalExperienceYears vs min_experience_years
        is_exp_evaluable = min_experience_years > 0 or profile.totalExperienceYears > 0
        if min_experience_years > 0:
            if profile.totalExperienceYears >= min_experience_years:
                exp_score = 100.0
                matched_requirements.append(f"Experience: {profile.totalExperienceYears:.1f} yrs (Meets min {min_experience_years} yrs)")
            elif profile.totalExperienceYears > 0:
                ratio = profile.totalExperienceYears / min_experience_years
                exp_score = min(100.0, ratio * 100.0)
                unclear_requirements.append(f"Experience: {profile.totalExperienceYears:.1f} yrs (Target: {min_experience_years} yrs)")
            else:
                exp_score = 0.0
                unclear_requirements.append(f"Experience dates could not be verified from resume.")
        else:
            exp_score = min(100.0, profile.totalExperienceYears * 20.0) if profile.totalExperienceYears > 0 else 75.0

        # Criterion 3: Relevant Projects Score
        # Evaluate projects tech overlap with required skills and responsibilities
        is_proj_evaluable = len(profile.projects) > 0
        if is_proj_evaluable:
            proj_techs = set()
            for p in profile.projects:
                for t in p.technologies:
                    proj_techs.add(normalize_skill(t))
            
            job_techs = {normalize_skill(s) for s in required_skills + preferred_skills}
            overlap = proj_techs.intersection(job_techs) if job_techs else set()
            
            base_score = min(len(profile.projects) * 30.0, 60.0)
            overlap_bonus = (len(overlap) / max(len(job_techs), 1)) * 40.0 if job_techs else 40.0
            proj_score = min(100.0, base_score + overlap_bonus)
            if overlap:
                matched_requirements.append(f"Projects demonstrate: {', '.join(list(overlap)[:4])}")
        else:
            # If no formal projects section, check if work history contains highlighted achievements
            has_highlights = any(len(w.highlights) > 0 for w in profile.workHistory)
            proj_score = 50.0 if has_highlights else 25.0

        # Criterion 4: Education & Certifications Score
        is_edu_evaluable = len(education_reqs) > 0 or len(cert_reqs) > 0 or len(profile.education) > 0
        edu_score = 0.0
        if len(education_reqs) > 0:
            matched_edu = False
            for req in education_reqs:
                req_lower = req.lower()
                for c_edu in profile.education:
                    if (c_edu.degree.lower() in req_lower or req_lower in c_edu.degree.lower()
                        or any(t in c_edu.degree.lower() for t in ["bachelor", "master", "degree", "b.tech", "m.tech", "phd", "b.s", "m.s"])):
                        matched_edu = True
                        break
            if matched_edu:
                edu_score += 60.0
                matched_requirements.append("Education requirements satisfied.")
            else:
                edu_score += 20.0 if len(profile.education) > 0 else 0.0
                unclear_requirements.append("Specific degree requirement could not be automatically confirmed.")
        else:
            edu_score += 70.0 if len(profile.education) > 0 else 50.0

        if len(cert_reqs) > 0:
            matched_cert = False
            for c_req in cert_reqs:
                for c_cert in profile.certifications:
                    if c_req.lower() in c_cert.lower():
                        matched_cert = True
                        break
            if matched_cert:
                edu_score += 40.0
                matched_requirements.append("Target certifications found.")
            else:
                unclear_requirements.append("Certifications missing or under alternate credential title.")
        else:
            edu_score += 30.0 if len(profile.certifications) > 0 else 15.0

        edu_score = min(100.0, edu_score)

        # Step 8, 9, 10: Dynamic Weight Renormalization & Overall Score
        # Determine evaluability flags
        criteria_matrix = [
            ("requiredSkills", job_weights.requiredSkills, skill_score, is_skill_evaluable),
            ("experience", job_weights.experience, exp_score, is_exp_evaluable),
            ("projects", job_weights.projects, proj_score, is_proj_evaluable),
            ("educationCerts", job_weights.educationCerts, edu_score, is_edu_evaluable),
        ]

        evaluable_criteria = [c for c in criteria_matrix if c[3]]
        evaluable_count = len(evaluable_criteria)
        total_criteria_count = len(criteria_matrix)
        coverage_percentage = (evaluable_count / total_criteria_count) * 100.0

        if evaluable_count == 0:
            # Handle zero evaluable criteria without division by zero
            overall_score = 0.0
            renormalized_weights = {}
        else:
            total_evaluable_weight = sum(c[1] for c in evaluable_criteria)
            if total_evaluable_weight <= 0:
                total_evaluable_weight = 100.0

            overall_score = sum(
                (c[1] / total_evaluable_weight) * c[2]
                for c in evaluable_criteria
            )

        overall_score = max(0.0, min(100.0, round(overall_score, 1)))

        # Processing warnings
        warnings = []
        if profile.isScannedWarning:
            warnings.append("Document had low text layer density; OCR or high-resolution upload recommended.")
        if profile.totalExperienceYears == 0.0:
            warnings.append("Could not extract explicit calendar date ranges; experience score estimated.")
        if coverage_percentage < 70.0:
            warnings.append(f"Evaluation coverage is {coverage_percentage:.0f}%; some job criteria were unevaluable from this resume.")

        return {
            "overallScore": overall_score,
            "evaluationCoverage": round(coverage_percentage, 1),
            "evaluableCriteriaCount": evaluable_count,
            "totalCriteriaCount": total_criteria_count,
            "criterionScores": CriterionScoreBreakdown(
                requiredSkills=round(skill_score, 1),
                experience=round(exp_score, 1),
                projects=round(proj_score, 1),
                educationCerts=round(edu_score, 1)
            ),
            "skillGaps": skill_gaps,
            "matchedRequirements": matched_requirements,
            "missingRequirements": missing_requirements,
            "unclearRequirements": unclear_requirements,
            "processingWarnings": warnings,
            "methodologyNote": (
                f"Computed using deterministic weighted alignment: Required Skills ({job_weights.requiredSkills}%), "
                f"Experience ({job_weights.experience}%), Projects ({job_weights.projects}%), "
                f"Education/Certs ({job_weights.educationCerts}%). "
                f"Weights were renormalized over {evaluable_count}/{total_criteria_count} evaluable criteria."
            )
        }
