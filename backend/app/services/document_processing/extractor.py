import os
import hashlib
import logging
from typing import Tuple, Dict, Any, List

logger = logging.getLogger(__name__)

class DocumentExtractor:
    @staticmethod
    def calculate_sha256(file_bytes: bytes) -> str:
        """Computes SHA-256 hash for duplicate file detection."""
        return hashlib.sha256(file_bytes).hexdigest()

    @classmethod
    def extract_text_from_pdf(cls, file_path: str) -> Tuple[str, List[Dict[str, Any]], bool]:
        """
        Extracts text page-by-page using PyMuPDF (fitz).
        Returns: (full_text, pages_data, is_scanned_warning)
        """
        import fitz  # PyMuPDF
        pages_data = []
        full_text_parts = []
        is_scanned_warning = False

        doc = None
        try:
            doc = fitz.open(file_path)
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                page_text = page.get_text("text") or ""
                clean_page_text = page_text.strip()
                pages_data.append({
                    "pageNumber": page_num + 1,
                    "text": clean_page_text,
                    "charCount": len(clean_page_text)
                })
                if clean_page_text:
                    full_text_parts.append(clean_page_text)

            full_text = "\n\n".join(full_text_parts)
            
            # Scanned PDF detection heuristic
            # If multi-page or 1 page has fewer than 80 total characters, likely image scan
            total_chars = sum(p["charCount"] for p in pages_data)
            if len(pages_data) > 0 and (total_chars < 80 or (total_chars / len(pages_data)) < 30):
                is_scanned_warning = True

            return full_text, pages_data, is_scanned_warning
        finally:
            if doc:
                doc.close()

    @classmethod
    def extract_text_from_docx(cls, file_path: str) -> Tuple[str, List[Dict[str, Any]], bool]:
        """
        Extracts text from DOCX files using python-docx.
        Extracts paragraphs and tables.
        """
        from docx import Document
        doc = Document(file_path)
        paragraphs = []

        for p in doc.paragraphs:
            text = p.text.strip()
            if text:
                paragraphs.append(text)

        # Also extract table text
        for table in doc.tables:
            for row in table.rows:
                row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_cells:
                    paragraphs.append(" | ".join(row_cells))

        full_text = "\n".join(paragraphs)
        pages_data = [{"pageNumber": 1, "text": full_text, "charCount": len(full_text)}]
        is_scanned_warning = len(full_text.strip()) < 50
        return full_text, pages_data, is_scanned_warning

    @classmethod
    def extract_document(cls, file_path: str, filename: str) -> Tuple[str, List[Dict[str, Any]], bool]:
        """
        Routes extraction based on file extension.
        """
        lower = filename.lower()
        if lower.endswith(".pdf"):
            return cls.extract_text_from_pdf(file_path)
        elif lower.endswith(".docx") or lower.endswith(".doc"):
            return cls.extract_text_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file format for document: {filename}. Supported: PDF, DOCX.")
