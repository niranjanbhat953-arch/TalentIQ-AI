import io
import csv
from typing import List, Dict, Any
from app.models.schemas import CandidateResultResponse

class ExportService:
    @staticmethod
    def sanitize_csv_value(val: Any) -> str:
        """
        Mitigates CSV formula injection (OWASP).
        If value starts with =, +, -, @, \t, or \r, prefix with apostrophe.
        """
        if val is None:
            return ""
        s = str(val)
        if len(s) > 0 and s[0] in ("=", "+", "-", "@", "\t", "\r"):
            return f"'{s.strip()}"
        return s.strip()

    @classmethod
    def generate_screening_csv(cls, job_title: str, results: List[Dict[str, Any]]) -> str:
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

        headers = [
            "Candidate Name",
            "Job Title",
            "Overall Alignment Score (0-100)",
            "Evaluation Coverage (%)",
            "Required Skills Score",
            "Experience Score",
            "Projects Score",
            "Education & Certs Score",
            "Review Status",
            "Matched Requirements",
            "Missing/Unclear Requirements",
            "Recruiter Notes",
            "Screening Timestamp",
            "Methodology Disclaimer"
        ]
        writer.writerow([cls.sanitize_csv_value(h) for h in headers])

        for r in results:
            scores = r.get("criterionScores") or {}
            if hasattr(scores, "dict"):
                scores = scores.dict()
            elif hasattr(scores, "model_dump"):
                scores = scores.model_dump()

            matched = "; ".join(r.get("matchedRequirements", []))
            unclear = "; ".join(r.get("missingRequirements", []) + r.get("unclearRequirements", []))

            row = [
                cls.sanitize_csv_value(r.get("candidateName", "Unknown")),
                cls.sanitize_csv_value(job_title),
                cls.sanitize_csv_value(r.get("overallScore", 0.0)),
                cls.sanitize_csv_value(f"{r.get('evaluationCoverage', 0.0)}%"),
                cls.sanitize_csv_value(scores.get("requiredSkills", 0.0)),
                cls.sanitize_csv_value(scores.get("experience", 0.0)),
                cls.sanitize_csv_value(scores.get("projects", 0.0)),
                cls.sanitize_csv_value(scores.get("educationCerts", 0.0)),
                cls.sanitize_csv_value(r.get("reviewStatus", "NOT_REVIEWED")),
                cls.sanitize_csv_value(matched),
                cls.sanitize_csv_value(unclear),
                cls.sanitize_csv_value(r.get("recruiterNotes", "")),
                cls.sanitize_csv_value(r.get("createdAt", "")),
                cls.sanitize_csv_value("TalentIQ AI is a decision-support platform. Missing evidence does not prove candidate lacks skill.")
            ]
            writer.writerow(row)

        return output.getvalue()

    @classmethod
    def generate_candidate_pdf(cls, candidate_data: Dict[str, Any], job_title: str) -> bytes:
        """
        Generates a structured PDF candidate report using ReportLab.
        """
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=22,
            textColor=colors.HexColor('#0F172A'),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#64748B'),
            spaceAfter=12
        )
        heading2_style = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontSize=13,
            textColor=colors.HexColor('#4F46E5'),
            spaceBefore=10,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#1E293B'),
            leading=14
        )

        elements = []

        # Header
        elements.append(Paragraph("TALENTIQ AI - CANDIDATE EVALUATION DOSSIER", title_style))
        elements.append(Paragraph(f"Position: <b>{job_title}</b> | Generated: {candidate_data.get('createdAt', '')[:10]}", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#6366F1'), spaceAfter=14))

        # Candidate Summary Table
        c_name = candidate_data.get("candidateName", "Candidate")
        overall = candidate_data.get("overallScore", 0.0)
        coverage = candidate_data.get("evaluationCoverage", 0.0)
        status = candidate_data.get("reviewStatus", "NOT_REVIEWED")

        summary_data = [
            ["Candidate Name:", c_name, "Review Status:", status],
            ["Alignment Score:", f"{overall}/100", "Evaluation Coverage:", f"{coverage}%"],
        ]
        t = Table(summary_data, colWidths=[110, 160, 120, 150])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#0F172A')),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 14))

        # Criterion Scores
        elements.append(Paragraph("Criterion Breakdown", heading2_style))
        scores = candidate_data.get("criterionScores") or {}
        if hasattr(scores, "dict"):
            scores = scores.dict()
        elif hasattr(scores, "model_dump"):
            scores = scores.model_dump()

        scores_table_data = [
            ["Criterion", "Score", "Evaluated Status"],
            ["Required Skills Alignment (40%)", f"{scores.get('requiredSkills', 0.0)}/100", "Evaluated"],
            ["Relevant Experience (25%)", f"{scores.get('experience', 0.0)}/100", "Evaluated"],
            ["Relevant Projects (20%)", f"{scores.get('projects', 0.0)}/100", "Evaluated"],
            ["Education & Certifications (15%)", f"{scores.get('educationCerts', 0.0)}/100", "Evaluated"],
        ]
        st = Table(scores_table_data, colWidths=[240, 100, 200])
        st.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#4F46E5')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(st)
        elements.append(Spacer(1, 14))

        # Matched Requirements
        elements.append(Paragraph("Verified Evidence & Matched Criteria", heading2_style))
        matched = candidate_data.get("matchedRequirements", [])
        if matched:
            for m in matched[:8]:
                elements.append(Paragraph(f"• <b>[Matched]</b> {m}", body_style))
        else:
            elements.append(Paragraph("No direct criterion matches recorded.", body_style))

        elements.append(Spacer(1, 10))

        # Missing / Unclear Requirements
        elements.append(Paragraph("Requirements Needing Recruiter Verification", heading2_style))
        unclear = candidate_data.get("missingRequirements", []) + candidate_data.get("unclearRequirements", [])
        if unclear:
            for u in unclear[:6]:
                elements.append(Paragraph(f"• <b>[Verify]</b> {u}", body_style))
        else:
            elements.append(Paragraph("No missing requirements detected.", body_style))

        elements.append(Spacer(1, 14))

        # Recruiter Notes
        notes = candidate_data.get("recruiterNotes")
        if notes:
            elements.append(Paragraph("Recruiter Review Notes", heading2_style))
            elements.append(Paragraph(notes, body_style))
            elements.append(Spacer(1, 10))

        # Disclaimer
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94A3B8'), spaceBefore=12, spaceAfter=8))
        disclaimer = (
            "<b>Decision Support Notice:</b> TalentIQ AI is an explainable decision-support tool, not an autonomous hiring authority. "
            "Scores reflect documented evidence in the submitted resume. Missing evidence does not prove a candidate lacks a skill. "
            "Human recruiters retain final decision-making authority."
        )
        elements.append(Paragraph(disclaimer, ParagraphStyle('Disc', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#64748B'))))

        doc.build(elements)
        return buffer.getvalue()
