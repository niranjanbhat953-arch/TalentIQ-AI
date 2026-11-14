import re
from typing import Dict, List, Set, Tuple

# Comprehensive skill alias map
SKILL_ALIASES: Dict[str, str] = {
    # Frontend
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "react native": "React Native",
    "angular": "Angular",
    "angularjs": "Angular",
    "vue": "Vue.js",
    "vuejs": "Vue.js",
    "vue.js": "Vue.js",
    "next": "Next.js",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "html": "HTML5",
    "html5": "HTML5",
    "css": "CSS3",
    "css3": "CSS3",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "bootstrap": "Bootstrap",
    "redux": "Redux",
    "zustand": "Zustand",
    
    # Backend & Languages
    "python": "Python",
    "python3": "Python",
    "py": "Python",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "express": "Express.js",
    "expressjs": "Express.js",
    "nest": "NestJS",
    "nestjs": "NestJS",
    "java": "Java",
    "spring": "Spring Boot",
    "springboot": "Spring Boot",
    "spring boot": "Spring Boot",
    "c#": "C#",
    ".net": ".NET",
    "dotnet": ".NET",
    "golang": "Go",
    "go": "Go",
    "rust": "Rust",
    "c++": "C++",
    "cpp": "C++",
    "ruby": "Ruby",
    "rails": "Ruby on Rails",
    "php": "PHP",
    "laravel": "Laravel",

    # Cloud & DevOps
    "aws": "AWS",
    "amazon web services": "AWS",
    "gcp": "Google Cloud",
    "google cloud platform": "Google Cloud",
    "azure": "Microsoft Azure",
    "docker": "Docker",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "terraform": "Terraform",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "github actions": "GitHub Actions",
    "gitlab ci": "GitLab CI",
    "jenkins": "Jenkins",
    "linux": "Linux",
    "bash": "Bash",
    "nginx": "Nginx",

    # Databases
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "psql": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "redis": "Redis",
    "firestore": "Cloud Firestore",
    "firebase": "Firebase",
    "dynamodb": "DynamoDB",
    "sqlite": "SQLite",
    "elasticsearch": "Elasticsearch",

    # AI & Data
    "machine learning": "Machine Learning",
    "ml": "Machine Learning",
    "ai": "Artificial Intelligence",
    "deep learning": "Deep Learning",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "scikit-learn": "Scikit-Learn",
    "sklearn": "Scikit-Learn",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "nlp": "Natural Language Processing",
    "llm": "Large Language Models",
    "langchain": "LangChain",
    
    # Architecture & Tools
    "rest": "REST API",
    "restful": "REST API",
    "graphql": "GraphQL",
    "grpc": "gRPC",
    "microservices": "Microservices",
    "git": "Git",
    "github": "GitHub",
    "jira": "Jira",
    "agile": "Agile",
    "scrum": "Scrum",
}

def normalize_skill(raw_skill: str) -> str:
    """
    Normalizes a skill name using alias map or title casing.
    """
    cleaned = raw_skill.strip().lower()
    # Strip trailing punctuation
    cleaned = re.sub(r"^[^\w+#]+|[^\w+#]+$", "", cleaned)
    if cleaned in SKILL_ALIASES:
        return SKILL_ALIASES[cleaned]
    # Return Title Case if no alias
    return raw_skill.strip().title()

def extract_known_skills_from_text(text: str) -> List[str]:
    """
    Extracts all known normalized skills mentioned in raw text.
    """
    if not text:
        return []
    
    found_skills: Set[str] = set()
    lower_text = " " + text.lower() + " "

    for alias, canonical in SKILL_ALIASES.items():
        # Match word boundaries or symbols like C++ / C# / .NET
        pattern = r'(?<![a-zA-Z0-9])' + re.escape(alias) + r'(?![a-zA-Z0-9])'
        if re.search(pattern, lower_text):
            found_skills.add(canonical)

    return sorted(list(found_skills))

def match_skill_presence(required_skill: str, candidate_skills: List[str], candidate_full_text: str) -> Tuple[bool, str]:
    """
    Checks if a required skill is present either in extracted skills list
    or within candidate's textual evidence.
    Returns (is_matched, canonical_name).
    """
    norm_required = normalize_skill(required_skill)
    norm_candidate_skills = [normalize_skill(s) for s in candidate_skills]

    # Exact or alias match in candidate skills list
    if norm_required in norm_candidate_skills:
        return True, norm_required

    # Substring / boundary search in candidate full text
    alias_matches = [alias for alias, canonical in SKILL_ALIASES.items() if canonical == norm_required]
    alias_matches.append(norm_required.lower())
    alias_matches.append(required_skill.lower())

    lower_text = candidate_full_text.lower()
    for alias in alias_matches:
        pattern = r'(?<![a-zA-Z0-9])' + re.escape(alias) + r'(?![a-zA-Z0-9])'
        if re.search(pattern, lower_text):
            return True, norm_required

    return False, norm_required
