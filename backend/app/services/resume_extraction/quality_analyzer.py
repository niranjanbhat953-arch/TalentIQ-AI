import re
from typing import List, Dict, Any
from app.models.schemas import ExtractedProfile, ResumeQualityFinding, ResumeQualityAnalysisResponse

class ResumeQualityAnalyzer:
    """
    Evaluates resume presentation clarity, unquantified claims, and unsupported skills.
    Explicitly distinguishes presentation clarity from candidate competence.
    Never penalizes employment gaps, career changes, or nontraditional education.
    """

    @classmethod
    def analyze(cls, profile: ExtractedProfile, resume_id: str) -> ResumeQualityAnalysisResponse:
        findings: List[ResumeQualityFinding] = []
        strengths: List[str] = []
        score = 100.0

        # 1. Check for Measurable Metrics / Quantified Context
        metric_regex = r'\b(\d+%\s*|\$\d+|\d+\s*x|\d+\s*(?:ms|sec|seconds|users|million|k|billion))\b'
        has_metrics = False
        all_highlights = []
        for w in profile.workHistory:
            all_highlights.extend(w.highlights)

        for h in all_highlights:
            if re.search(metric_regex, h, re.IGNORECASE):
                has_metrics = True
                break

        if has_metrics:
            strengths.append("Includes quantifiable impact indicators (percentages, scale, or latency metrics).")
        else:
            score -= 15.0
            findings.append(ResumeQualityFinding(
                category="UNMEASURED_ACHIEVEMENT",
                severity="SUGGESTION",
                title="Achievements could benefit from measurable context",
                observation="Several work experience bullets describe responsibilities without metrics.",
                constructiveFeedback=(
                    "Whenever possible, include measurable business or technical outcomes "
                    "(e.g., 'reduced API response latency by 35%' or 'scaled to 50K daily active users')."
                ),
                relevantSnippet=all_highlights[0] if all_highlights else None
            ))

        # 2. Check for Passive / Vague Phrasing
        passive_patterns = [r'\binvolved in\b', r'\bworked on\b', r'\bhelped with\b', r'\bassisted in\b', r'\bparticipated in\b']
        vague_examples = []
        for h in all_highlights:
            for p in passive_patterns:
                if re.search(p, h, re.IGNORECASE):
                    vague_examples.append(h)
                    break

        if vague_examples:
            score -= 10.0
            findings.append(ResumeQualityFinding(
                category="VAGUE_CONTRIBUTION",
                severity="IMPROVEMENT",
                title="Unclear personal technical contribution",
                observation=f"Found phrasing like 'involved in' or 'worked on' in {len(vague_examples)} bullet(s).",
                constructiveFeedback=(
                    "Use active, high-impact verbs emphasizing direct ownership "
                    "(e.g., 'Architected', 'Implemented', 'Refactored', 'Deployed')."
                ),
                relevantSnippet=vague_examples[0]
            ))
        else:
            strengths.append("Uses active, action-oriented verbs demonstrating clear individual contribution.")

        # 3. Check for Skills Listed without Supporting Evidence in Experience/Projects
        evidence_text = " ".join(all_highlights) + " " + " ".join(p.description for p in profile.projects)
        unsupported_skills = []
        for skill in profile.skills:
            if skill.lower() not in evidence_text.lower():
                unsupported_skills.append(skill)

        if len(unsupported_skills) > 3:
            score -= 12.0
            sample_unsupported = unsupported_skills[:4]
            findings.append(ResumeQualityFinding(
                category="UNSUPPORTED_SKILL",
                severity="SUGGESTION",
                title="Skills listed without in-context evidence",
                observation=(
                    f"Skills such as {', '.join(sample_unsupported)} are listed in the skills summary "
                    f"but do not appear in specific project or work experience bullet points."
                ),
                constructiveFeedback=(
                    "Strengthen credibility by referencing where each declared skill was applied "
                    "in work history or portfolio projects."
                ),
                relevantSnippet=None
            ))
        else:
            strengths.append("Declared skills are consistently backed by context within work history and projects.")

        # 4. Check Project Descriptions
        if profile.projects:
            vague_projects = [p for p in profile.projects if len(p.description) < 40 or not p.technologies]
            if vague_projects:
                score -= 8.0
                findings.append(ResumeQualityFinding(
                    category="VAGUE_PROJECT",
                    severity="INFO",
                    title="Project descriptions could include deeper technical detail",
                    observation=f"Project '{vague_projects[0].name}' lacks details on stack, architecture, or problems solved.",
                    constructiveFeedback="Include the technologies used, problems solved, and link to code or demo where possible.",
                    relevantSnippet=vague_projects[0].description
                ))
            else:
                strengths.append("Portfolio projects clearly articulate the technical stack and objectives.")

        # 5. Summary / Profile Section
        if len(profile.summary.strip()) > 30:
            strengths.append("Provides a concise introductory summary establishing role alignment.")
        else:
            score -= 5.0
            findings.append(ResumeQualityFinding(
                category="CLARITY",
                severity="INFO",
                title="Consider adding a focused executive summary",
                observation="Resume begins directly with experience without an introductory summary statement.",
                constructiveFeedback="A 2-3 sentence executive summary quickly contextualizes core competencies for recruiters.",
                relevantSnippet=None
            ))

        final_score = max(35.0, min(100.0, round(score, 1)))

        return ResumeQualityAnalysisResponse(
            resumeId=resume_id,
            candidateName=profile.candidateName,
            presentationClarityScore=final_score,
            findings=findings,
            strengths=strengths
        )
