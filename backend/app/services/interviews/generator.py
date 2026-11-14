import uuid
import logging
from typing import List, Dict, Any, Optional, Tuple
from app.models.schemas import (
    InterviewQuestion, QuestionCategory, QuestionDifficulty,
    InterviewGenerateRequest, ExtractedProfile
)
from app.core.config import settings

logger = logging.getLogger(__name__)

class InterviewQuestionGenerator:
    """
    Generates tailored, competency-based interview questions.
    Uses LLM if API key configured, otherwise provides rich rule-based fallback.
    Clearly marks generationSource as 'LLM_ASSISTED' or 'RULE_ENGINE_FALLBACK'.
    """

    @classmethod
    async def generate(
        cls,
        job_data: Dict[str, Any],
        profile: Optional[ExtractedProfile] = None,
        categories: Optional[List[QuestionCategory]] = None,
        question_count: int = 5,
        target_difficulty: QuestionDifficulty = QuestionDifficulty.MID
    ) -> Tuple[List[InterviewQuestion], str]:
        title = job_data.get("title", "Role")
        req_skills = job_data.get("requiredSkills", [])
        pref_skills = job_data.get("preferredSkills", [])
        responsibilities = job_data.get("responsibilities", [])

        # Check if external LLM is available
        if settings.GEMINI_API_KEY:
            try:
                questions = await cls._generate_with_gemini(
                    job_data, profile, categories, question_count, target_difficulty
                )
                if questions:
                    return questions, "LLM_ASSISTED"
            except Exception as e:
                logger.warning(f"External LLM generation failed: {e}. Falling back to rule-based engine.")

        # Rule-based generator
        questions = cls._generate_rule_based(
            job_data, profile, categories, question_count, target_difficulty
        )
        return questions, "RULE_ENGINE_FALLBACK"

    @classmethod
    def _generate_rule_based(
        cls,
        job_data: Dict[str, Any],
        profile: Optional[ExtractedProfile],
        categories: Optional[List[QuestionCategory]],
        question_count: int,
        target_difficulty: QuestionDifficulty
    ) -> List[InterviewQuestion]:
        title = job_data.get("title", "Specialist")
        req_skills = job_data.get("requiredSkills", ["Core Engineering"])
        pref_skills = job_data.get("preferredSkills", [])
        all_skills = req_skills + pref_skills
        projects = profile.projects if profile else []
        work_hist = profile.workHistory if profile else []

        selected_categories = categories or [
            QuestionCategory.TECHNICAL,
            QuestionCategory.PROJECT_DEEP_DIVE,
            QuestionCategory.PROBLEM_SOLVING,
            QuestionCategory.ROLE_SCENARIO,
            QuestionCategory.BEHAVIORAL
        ]

        questions: List[InterviewQuestion] = []

        # 1. Technical Questions based on required skills
        for i, skill in enumerate(req_skills[:3]):
            if len(questions) >= question_count:
                break
            questions.append(InterviewQuestion(
                id=str(uuid.uuid4()),
                category=QuestionCategory.TECHNICAL,
                competency=f"{skill} Architecture & Optimization",
                difficulty=target_difficulty,
                questionText=(
                    f"In high-concurrency environments, what architectural patterns and optimization strategies "
                    f"do you implement when building systems with {skill}?"
                ),
                relevanceReason=f"Directly listed as a required core skill for the {title} position.",
                candidateEvidence=(
                    f"Candidate demonstrated experience with {skill} in recent work." if profile and skill in profile.skills
                    else f"Resume does not explicitly verify production depth in {skill}; verification recommended."
                ),
                expectedIndicators=[
                    f"Explains core execution model and lifecycle of {skill}",
                    "Discusses state management, caching, or database interaction patterns",
                    "Mentions benchmarking, performance bottlenecks, and instrumentation"
                ],
                followUpProbes=[
                    f"How do you test and profile performance in {skill}?",
                    "What common anti-patterns have you encountered and refactored?"
                ]
            ))

        # 2. Project Deep Dive
        if projects and len(questions) < question_count:
            proj = projects[0]
            questions.append(InterviewQuestion(
                id=str(uuid.uuid4()),
                category=QuestionCategory.PROJECT_DEEP_DIVE,
                competency="System Design & End-to-End Ownership",
                difficulty=target_difficulty,
                questionText=(
                    f"On your project '{proj.name}', what were the most significant engineering trade-offs "
                    f"you navigated during implementation, and what would you design differently today?"
                ),
                relevanceReason="Validates hands-on ownership and self-critical architectural reasoning.",
                candidateEvidence=f"Candidate portfolio cites project '{proj.name}' using: {', '.join(proj.technologies[:4])}.",
                expectedIndicators=[
                    "Clearly defines project scope, scale, and failure modes",
                    "Articulates why particular libraries or design decisions were favored",
                    "Acknowledges technical debt and future scalability considerations"
                ],
                followUpProbes=[
                    "What telemetry or logging did you configure to verify system health in production?",
                    "How was security and authorization handled in this architecture?"
                ]
            ))

        # 3. Problem Solving / Scenario
        if len(questions) < question_count:
            resp = job_data.get("responsibilities", ["scalable cloud services"])[0] if job_data.get("responsibilities") else "production reliability"
            questions.append(InterviewQuestion(
                id=str(uuid.uuid4()),
                category=QuestionCategory.PROBLEM_SOLVING,
                competency="Root Cause Analysis & Incident Management",
                difficulty=target_difficulty,
                questionText=(
                    f"Imagine an outage where a critical API servicing '{resp}' experiences a 5x latency surge "
                    f"and cascading timeouts. Walk me step-by-step through your triage, diagnostic, and mitigation plan."
                ),
                relevanceReason=f"Evaluates problem solving under stress for key responsibility: {resp}.",
                candidateEvidence=None,
                expectedIndicators=[
                    "Prioritizes stabilizing users/traffic before deep code dissection (rollback/circuit breaker)",
                    "Checks dashboards, APM traces, error rates, and database lock saturation",
                    "Proposes post-mortem blameless culture and preventative regression tests"
                ],
                followUpProbes=[
                    "How do you communicate status to non-technical stakeholders during an active incident?",
                    "What SLA/SLO thresholds do you configure to alert on this proactively?"
                ]
            ))

        # 4. Behavioral / Cross-functional
        if len(questions) < question_count:
            questions.append(InterviewQuestion(
                id=str(uuid.uuid4()),
                category=QuestionCategory.BEHAVIORAL,
                competency="Stakeholder Collaboration & Technical Disagreements",
                difficulty=target_difficulty,
                questionText=(
                    "Describe a time when you and a peer or product manager strongly disagreed on a technical decision "
                    "or feature timeline. How did you advocate your perspective, find common ground, and execute?"
                ),
                relevanceReason="Assesses emotional intelligence, cross-functional collaboration, and decision velocity.",
                candidateEvidence=None,
                expectedIndicators=[
                    "Focuses on shared product outcomes rather than personal ego",
                    "Uses data, prototypes, or user impact to make objective arguments",
                    "Demonstrates ability to 'disagree and commit' when leadership aligns"
                ],
                followUpProbes=[
                    "What was the eventual measurable outcome of that decision?",
                    "How did that experience influence how you build consensus today?"
                ]
            ))

        # 5. Role Scenario
        if len(questions) < question_count:
            questions.append(InterviewQuestion(
                id=str(uuid.uuid4()),
                category=QuestionCategory.ROLE_SCENARIO,
                competency="Prioritization & Technical Debt Management",
                difficulty=target_difficulty,
                questionText=(
                    f"As a {title}, you are asked to ship a feature in 3 weeks that normally requires 6 weeks. "
                    "How do you negotiate scope, protect architectural integrity, and manage technical debt?"
                ),
                relevanceReason=f"Essential operational requirement for the {title} position.",
                candidateEvidence=None,
                expectedIndicators=[
                    "Breaks requirements into Must-Have vs Nice-to-Have phases",
                    "Identifies specific non-functional compromises and schedules debt payoff",
                    "Maintains automated testing baseline to avoid shipping broken logic"
                ],
                followUpProbes=[
                    "What is one corner you would NEVER cut, even under executive pressure?",
                    "How do you track tech debt so it doesn't get forgotten?"
                ]
            ))

        return questions[:question_count]

    @classmethod
    async def _generate_with_gemini(
        cls,
        job_data: Dict[str, Any],
        profile: Optional[ExtractedProfile],
        categories: Optional[List[QuestionCategory]],
        question_count: int,
        target_difficulty: QuestionDifficulty
    ) -> Optional[List[InterviewQuestion]]:
        if not settings.GEMINI_API_KEY:
            return None

        import httpx
        import json

        title = job_data.get("title", "Role")
        req_skills = ", ".join(job_data.get("requiredSkills", []))
        candidate_context = ""
        if profile:
            candidate_context = f"Candidate: {profile.name}, Top Skills: {', '.join(profile.skills[:6])}"

        prompt = (
            f"Generate exactly {question_count} structured competency-based interview questions for the role: {title}.\n"
            f"Required Skills: {req_skills}.\n"
            f"{candidate_context}\n"
            f"Target Depth: {target_difficulty.value}.\n"
            "Return valid JSON array of objects with keys:\n"
            "- questionText (string)\n"
            "- competency (string)\n"
            "- category (one of: TECHNICAL, ARCHITECTURE, PROBLEM_SOLVING, BEHAVIORAL, ROLE_SCENARIO)\n"
            "- relevanceReason (string)\n"
            "- expectedIndicators (array of strings)\n"
            "- followUpProbes (array of strings)\n"
            "Output only raw JSON, no markdown formatting."
        )

        models_to_try = ["gemini-3.8-flash", "gemini-2.5-flash-lite"]
        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(
                        url,
                        json={"contents": [{"parts": [{"text": prompt}]}]}
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                        if text.startswith("```"):
                            text = text.split("```")[1]
                            if text.startswith("json"):
                                text = text[4:].strip()
                        raw_list = json.loads(text)
                        if isinstance(raw_list, list) and len(raw_list) > 0:
                            result = []
                            for item in raw_list[:question_count]:
                                cat_str = item.get("category", "TECHNICAL")
                                try:
                                    cat = QuestionCategory(cat_str)
                                except Exception:
                                    cat = QuestionCategory.TECHNICAL

                                result.append(InterviewQuestion(
                                    id=str(uuid.uuid4()),
                                    category=cat,
                                    competency=item.get("competency", "Core Competency"),
                                    difficulty=target_difficulty,
                                    questionText=item.get("questionText", f"Discuss your approach to {title}."),
                                    relevanceReason=item.get("relevanceReason", f"Target role requirement for {title}"),
                                    candidateEvidence=None,
                                    expectedIndicators=item.get("expectedIndicators", [
                                        "Demonstrates clear reasoning",
                                        "Explains architecture choices",
                                    ]),
                                    followUpProbes=item.get("followUpProbes", [
                                        "How would you optimize this under production load?",
                                    ]),
                                ))
                            if result:
                                return result
            except Exception as e:
                logger.debug(f"Gemini generation with {model} failed: {e}. Trying next or fallback.")
                continue

        return None
