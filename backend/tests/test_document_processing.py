import io
import fitz
from docx import Document
from app.services.document_processing.extractor import DocumentExtractor
from app.services.resume_extraction.parser import ResumeParser

def test_pdf_extraction_and_parsing(tmp_path):
    # Create synthetic PDF using PyMuPDF
    pdf_path = str(tmp_path / "synthetic_resume.pdf")
    doc = fitz.open()
    page = doc.new_page()
    text = (
        "Sarah Jenkins\n"
        "sarah.jenkins@example.com | (555) 234-5678 | Seattle, WA\n\n"
        "Summary:\n"
        "Senior Cloud Architect with 6+ years of experience in distributed systems and Kubernetes.\n\n"
        "Technical Skills:\n"
        "Python, React, TypeScript, Kubernetes, Docker, AWS, PostgreSQL, Redis, CI/CD\n\n"
        "Experience:\n"
        "TechCorp Inc - Senior Infrastructure Engineer (2018 - Present)\n"
        "• Architected multi-region Kubernetes clusters handling 40M daily requests.\n"
        "• Reduced API p99 latency by 32% through PostgreSQL query indexing and Redis caching.\n"
        "• Deployed infrastructure via Terraform and GitHub Actions CI/CD pipelines.\n\n"
        "Education:\n"
        "University of Washington - Bachelor of Science in Computer Science (2018)\n\n"
        "Certifications:\n"
        "AWS Certified Solutions Architect Associate\n"
    )
    page.insert_text((50, 50), text)
    doc.save(pdf_path)
    doc.close()

    # Extract
    raw_text, pages, is_scanned = DocumentExtractor.extract_document(pdf_path, "synthetic_resume.pdf")
    assert "Sarah Jenkins" in raw_text
    assert not is_scanned

    # Parse
    profile = ResumeParser.parse(raw_text, pages, is_scanned)
    assert profile.candidateName == "Sarah Jenkins"
    assert profile.email == "sarah.jenkins@example.com"
    assert "Python" in profile.skills
    assert "Kubernetes" in profile.skills
    assert profile.totalExperienceYears >= 5.0
    assert len(profile.education) > 0
    assert len(profile.certifications) > 0

def test_docx_extraction(tmp_path):
    docx_path = str(tmp_path / "candidate_test.docx")
    doc = Document()
    doc.add_heading("Alex Rivera", 0)
    doc.add_paragraph("alex.rivera@example.com | San Francisco, CA")
    doc.add_paragraph("Full-Stack Developer proficient in React, Node.js, and TypeScript.")
    doc.save(docx_path)

    raw_text, pages, is_scanned = DocumentExtractor.extract_document(docx_path, "candidate_test.docx")
    assert "Alex Rivera" in raw_text
    assert "alex.rivera@example.com" in raw_text

def test_duplicate_detection_by_hash():
    content_a = b"Candidate Resume Content Version 1.0"
    content_b = b"Candidate Resume Content Version 1.0"
    content_c = b"Different Candidate Content"

    hash_a = DocumentExtractor.calculate_sha256(content_a)
    hash_b = DocumentExtractor.calculate_sha256(content_b)
    hash_c = DocumentExtractor.calculate_sha256(content_c)

    assert hash_a == hash_b
    assert hash_a != hash_c
