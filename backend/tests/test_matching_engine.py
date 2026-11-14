from app.models.schemas import ExtractedProfile, WorkExperienceItem, EducationItem, ProjectItem, ScoringWeights
from app.services.matching.engine import MatchingEngine
from app.services.matching.skill_normalizer import normalize_skill, match_skill_presence

def test_skill_normalization_and_aliases():
    assert normalize_skill("k8s") == "Kubernetes"
    assert normalize_skill("react.js") == "React"
    assert normalize_skill("postgres") == "PostgreSQL"
    assert normalize_skill("golang") == "Go"
    assert normalize_skill("fastapi") == "FastAPI"

def test_deterministic_scoring():
    job_data = {
        "title": "Senior Backend Developer",
        "requiredSkills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "preferredSkills": ["Redis", "Kubernetes"],
        "minExperienceYears": 4.0,
        "educationRequirements": ["Bachelor's degree"],
        "certifications": [],
        "scoringWeights": {
            "requiredSkills": 40.0,
            "experience": 25.0,
            "projects": 20.0,
            "educationCerts": 15.0
        }
    }

    profile = ExtractedProfile(
        candidateName="Marcus Vance",
        summary="Experienced Python engineer specializing in microservices and PostgreSQL.",
        totalExperienceYears=5.0,
        skills=["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"],
        workHistory=[
            WorkExperienceItem(
                company="Apex Cloud",
                title="Software Engineer",
                startDate="2019",
                endDate="Present",
                highlights=["Engineered FastAPI microservices and PostgreSQL databases."],
                skillsUsed=["Python", "FastAPI", "PostgreSQL"]
            )
        ],
        education=[
            EducationItem(
                institution="State University",
                degree="Bachelor of Science",
                fieldOfStudy="Computer Science",
                graduationYear=2019
            )
        ],
        projects=[
            ProjectItem(
                name="Distributed Task Queue",
                description="Built an asynchronous task runner with Python and Redis.",
                technologies=["Python", "Redis", "Docker"]
            )
        ]
    )

    eval_1 = MatchingEngine.evaluate_candidate(job_data, profile)
    eval_2 = MatchingEngine.evaluate_candidate(job_data, profile)

    # Determinism assertion: identical inputs produce identical scores and breakdown
    assert eval_1["overallScore"] == eval_2["overallScore"]
    assert eval_1["evaluationCoverage"] == eval_2["evaluationCoverage"]
    assert eval_1["overallScore"] > 80.0
    assert eval_1["evaluationCoverage"] == 100.0

def test_weight_renormalization_for_unevaluable_criteria():
    # Job with no experience or education requirement
    job_data = {
        "title": "Open Source Contributor",
        "requiredSkills": ["Rust", "Git"],
        "preferredSkills": [],
        "minExperienceYears": 0.0,
        "educationRequirements": [],
        "certifications": [],
        "scoringWeights": {
            "requiredSkills": 40.0,
            "experience": 25.0,
            "projects": 20.0,
            "educationCerts": 15.0
        }
    }

    profile = ExtractedProfile(
        candidateName="Jordan Lee",
        summary="Rust enthusiast and open source hacker.",
        totalExperienceYears=0.0,
        skills=["Rust", "Git"],
        workHistory=[],
        education=[],
        projects=[
            ProjectItem(
                name="Rust CLI Parser",
                description="Fast command line parser built in Rust.",
                technologies=["Rust", "Git"]
            )
        ]
    )

    eval_res = MatchingEngine.evaluate_candidate(job_data, profile)
    # Ensure no division by zero occurred and weights were renormalized
    assert eval_res["overallScore"] >= 0.0
    assert eval_res["overallScore"] <= 100.0
    assert eval_res["evaluableCriteriaCount"] > 0
