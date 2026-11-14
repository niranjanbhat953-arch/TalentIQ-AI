from app.services.reports.export_service import ExportService

def test_csv_formula_injection_mitigation():
    dangerous_inputs = [
        "=cmd|'/C calc'!A0",
        "+1+2",
        "-5+10",
        "@SUM(A1:A10)",
        "\tmalicious_tab",
        "Normal Safe Candidate Name"
    ]

    for val in dangerous_inputs:
        sanitized = ExportService.sanitize_csv_value(val)
        if val.startswith(("=", "+", "-", "@", "\t")):
            assert sanitized.startswith("'"), f"Dangerous input '{val}' was not escaped with leading quote."
        else:
            assert sanitized == "Normal Safe Candidate Name"

def test_pdf_report_generation():
    candidate_data = {
        "candidateName": "Elena Rostova",
        "overallScore": 92.5,
        "evaluationCoverage": 100.0,
        "reviewStatus": "SHORTLISTED",
        "createdAt": "2026-10-14T10:00:00",
        "criterionScores": {
            "requiredSkills": 95.0,
            "experience": 90.0,
            "projects": 95.0,
            "educationCerts": 88.0
        },
        "matchedRequirements": ["Python", "Kubernetes", "AWS Solutions Architect"],
        "missingRequirements": [],
        "unclearRequirements": [],
        "recruiterNotes": "Candidate demonstrated exceptional architecture depth during screening."
    }

    pdf_bytes = ExportService.generate_candidate_pdf(candidate_data, "Lead Cloud Architect")
    assert pdf_bytes is not None
    assert len(pdf_bytes) > 500
    assert pdf_bytes.startswith(b"%PDF"), "Generated file does not have valid PDF magic bytes header."
