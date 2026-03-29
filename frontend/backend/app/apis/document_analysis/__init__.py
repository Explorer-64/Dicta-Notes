import io
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.apis.firebase import get_firestore_db
from app.apis.gemini_client import get_gemini_client
from app.apis.helpers import get_current_user

logger = logging.getLogger("dicta.document_analysis")

router = APIRouter(prefix="/document_analysis")

MAX_UPLOAD_BYTES = 20 * 1024 * 1024
GEMINI_TEXT_MAX = 100_000

ALLOWED_EXT = {".pdf", ".docx", ".txt"}
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}
MIME_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


class AnalyzeResponse(BaseModel):
    id: str
    title: str
    summary: str
    key_points: List[str]
    action_items: List[str]
    full_text: str
    language_detected: str
    source_filename: str
    created_at: str


class DocumentListItem(BaseModel):
    id: str
    title: str
    summary: str
    language_detected: str
    source_filename: str
    created_at: str


class DocumentListResponse(BaseModel):
    documents: List[DocumentListItem]


def _uid(claims: Dict[str, Any]) -> str:
    return str(claims.get("uid") or claims.get("sub") or "")


def _extract_pdf(data: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(data))
    parts: List[str] = []
    for page in reader.pages:
        parts.append(page.extract_text() or "")
    return "\n".join(parts)


def _extract_docx(data: bytes) -> str:
    from docx import Document

    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs)


def _extract_txt(data: bytes) -> str:
    for encoding in ("utf-8", "utf-8-sig", "cp1252", "latin-1"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace")


def _extract_text(filename: str, data: bytes) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return _extract_pdf(data)
    if lower.endswith(".docx"):
        return _extract_docx(data)
    if lower.endswith(".txt"):
        return _extract_txt(data)
    raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, DOCX, or TXT.")


def _truncate_for_model(full: str) -> tuple[str, bool]:
    if len(full) <= GEMINI_TEXT_MAX:
        return full, False
    head = full[: GEMINI_TEXT_MAX // 2]
    tail = full[-(GEMINI_TEXT_MAX // 2) :]
    return f"{head}\n\n[... middle omitted for model context ...]\n\n{tail}", True


def _parse_json_object(raw: str) -> Dict[str, Any]:
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines)
    return json.loads(text)


def _normalize_str_list(val: Any) -> List[str]:
    if val is None:
        return []
    if isinstance(val, list):
        return [str(x).strip() for x in val if str(x).strip()]
    if isinstance(val, str) and val.strip():
        return [val.strip()]
    return []


def _analyze_with_gemini(extracted: str, source_filename: str) -> Dict[str, Any]:
    model = get_gemini_client("gemini-2.5-flash")
    body_for_model, was_truncated = _truncate_for_model(extracted)
    prompt = f"""You are a document analysis assistant. Analyze the following document text and respond with ONLY valid JSON (no markdown, no code fences) matching this exact shape:
{{
  "summary": "string, concise overview",
  "key_points": ["string", "..."],
  "action_items": ["string", "..."],
  "title": "string, short descriptive title; if unknown use empty string",
  "language_detected": "ISO 639-1 language code of the main document language (e.g. en, es)"
}}

Original filename hint: {source_filename}
The document text may be truncated for very long files: {str(was_truncated).lower()}.

Document text:
{body_for_model}
"""
    try:
        response = model.generate_content(prompt)
    except Exception as e:
        logger.error("Gemini document analysis failed: %s", e)
        raise HTTPException(status_code=502, detail=f"Document analysis failed: {e!s}") from e

    raw_text = getattr(response, "text", None) or ""
    if not raw_text.strip():
        raise HTTPException(status_code=502, detail="Empty response from analysis model")

    try:
        parsed = _parse_json_object(raw_text)
    except json.JSONDecodeError as e:
        logger.warning("Failed to parse Gemini JSON: %s", e)
        raise HTTPException(
            status_code=502,
            detail="Could not parse analysis result. Please try again.",
        ) from e

    title = str(parsed.get("title") or "").strip() or source_filename
    summary = str(parsed.get("summary") or "").strip()
    language = str(parsed.get("language_detected") or "und").strip() or "und"
    key_points = _normalize_str_list(parsed.get("key_points"))
    action_items = _normalize_str_list(parsed.get("action_items"))
    return {
        "title": title,
        "summary": summary,
        "key_points": key_points,
        "action_items": action_items,
        "language_detected": language,
    }


def _analyze_images_with_gemini(images: List[tuple[bytes, str]], source_filename: str) -> Dict[str, Any]:
    """Analyze one or more document page images via Gemini vision."""
    from google.genai import types as genai_types

    model = get_gemini_client("gemini-2.5-flash")
    page_count = len(images)
    prompt = f"""You are a document analysis assistant. The following {'image is' if page_count == 1 else f'{page_count} images are'} {'a page' if page_count == 1 else 'pages'} of a document photographed by the user.

Extract all visible text from {'the image' if page_count == 1 else 'all images in order'}, then analyze the full content.

Respond with ONLY valid JSON (no markdown, no code fences) matching this exact shape:
{{
  "summary": "string, concise overview of the document",
  "key_points": ["string", "..."],
  "action_items": ["string", "..."],
  "title": "string, short descriptive title; if unknown use empty string",
  "language_detected": "ISO 639-1 language code of the main document language (e.g. en, es)",
  "extracted_text": "string, all text extracted from the document in reading order"
}}

Original filename hint: {source_filename}"""

    image_parts = [
        genai_types.Part.from_bytes(data=img_bytes, mime_type=mime_type)
        for img_bytes, mime_type in images
    ]
    contents = image_parts + [prompt]

    try:
        response = model.generate_content(contents)
    except Exception as e:
        logger.error("Gemini image analysis failed: %s", e)
        raise HTTPException(status_code=502, detail=f"Image analysis failed: {e!s}") from e

    raw_text = getattr(response, "text", None) or ""
    if not raw_text.strip():
        raise HTTPException(status_code=502, detail="Empty response from analysis model")

    try:
        parsed = _parse_json_object(raw_text)
    except Exception as e:
        raise HTTPException(status_code=502, detail="Could not parse analysis result. Please try again.") from e

    title = str(parsed.get("title") or "").strip() or source_filename
    summary = str(parsed.get("summary") or "").strip()
    language = str(parsed.get("language_detected") or "und").strip() or "und"
    key_points = _normalize_str_list(parsed.get("key_points"))
    action_items = _normalize_str_list(parsed.get("action_items"))
    extracted_text = str(parsed.get("extracted_text") or "").strip()

    return {
        "title": title,
        "summary": summary,
        "key_points": key_points,
        "action_items": action_items,
        "language_detected": language,
        "full_text": extracted_text,
    }


@router.post("/analyze-images", response_model=AnalyzeResponse)
def analyze_images(
    files: List[UploadFile] = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    uid = _uid(current_user)
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid user")
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 pages per analysis")

    images: List[tuple[bytes, str]] = []
    source_filename = files[0].filename or "photo.jpg"

    for upload in files:
        fname = upload.filename or ""
        ext = ("." + fname.rsplit(".", 1)[-1].lower()) if "." in fname else ""
        if ext not in IMAGE_EXT:
            raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'. Use JPG, PNG, or WEBP images.")
        data = upload.file.read()
        if len(data) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=400, detail="One or more files exceed the 20MB limit.")
        mime = MIME_TYPES.get(ext, "image/jpeg")
        images.append((data, mime))

    gemini_fields = _analyze_images_with_gemini(images, source_filename)

    db = get_firestore_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")

    created_at = datetime.now(timezone.utc).isoformat()
    parent = db.collection("documentAnalysis").document(uid)
    doc_ref = parent.collection("documents").document()
    doc_id = doc_ref.id

    page_label = f"{len(images)}-page scan" if len(images) > 1 else "photo scan"
    payload = {
        "user_id": uid,
        "source_filename": f"{source_filename} ({page_label})",
        "title": gemini_fields["title"],
        "summary": gemini_fields["summary"],
        "key_points": gemini_fields["key_points"],
        "action_items": gemini_fields["action_items"],
        "full_text": gemini_fields["full_text"],
        "language_detected": gemini_fields["language_detected"],
        "created_at": created_at,
    }
    doc_ref.set(payload)

    return AnalyzeResponse(
        id=doc_id,
        title=payload["title"],
        summary=payload["summary"],
        key_points=payload["key_points"],
        action_items=payload["action_items"],
        full_text=payload["full_text"],
        language_detected=payload["language_detected"],
        source_filename=payload["source_filename"],
        created_at=created_at,
    )


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_document(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    uid = _uid(current_user)
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid user")

    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    ext = ""
    if "." in file.filename:
        ext = "." + file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, DOCX, or TXT.")

    data = file.file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_UPLOAD_BYTES // (1024 * 1024)}MB.",
        )

    extracted = _extract_text(file.filename, data).strip()
    if not extracted:
        raise HTTPException(status_code=400, detail="No text could be extracted from this file.")

    gemini_fields = _analyze_with_gemini(extracted, file.filename)
    full_text = extracted

    db = get_firestore_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")

    created_at = datetime.now(timezone.utc).isoformat()
    parent = db.collection("documentAnalysis").document(uid)
    doc_ref = parent.collection("documents").document()
    doc_id = doc_ref.id

    payload = {
        "user_id": uid,
        "source_filename": file.filename,
        "title": gemini_fields["title"],
        "summary": gemini_fields["summary"],
        "key_points": gemini_fields["key_points"],
        "action_items": gemini_fields["action_items"],
        "full_text": full_text,
        "language_detected": gemini_fields["language_detected"],
        "created_at": created_at,
    }
    doc_ref.set(payload)

    return AnalyzeResponse(
        id=doc_id,
        title=payload["title"],
        summary=payload["summary"],
        key_points=payload["key_points"],
        action_items=payload["action_items"],
        full_text=payload["full_text"],
        language_detected=payload["language_detected"],
        source_filename=file.filename,
        created_at=created_at,
    )


@router.get("/list", response_model=DocumentListResponse)
def list_analyses(current_user: Dict[str, Any] = Depends(get_current_user)):
    uid = _uid(current_user)
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid user")

    db = get_firestore_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")

    col = db.collection("documentAnalysis").document(uid).collection("documents")
    snap = col.stream()

    items: List[DocumentListItem] = []
    for doc in snap:
        d = doc.to_dict() or {}
        created = d.get("created_at")
        if created is not None and hasattr(created, "isoformat"):
            created_str = created.isoformat()
        elif created is not None and hasattr(created, "timestamp"):
            created_str = datetime.fromtimestamp(created.timestamp(), tz=timezone.utc).isoformat()
        else:
            created_str = str(created or "")

        title = str(d.get("title") or d.get("source_filename") or "Untitled")
        summary = str(d.get("summary") or "")
        snippet = summary if len(summary) <= 280 else summary[:277] + "..."
        items.append(
            DocumentListItem(
                id=doc.id,
                title=title,
                summary=snippet,
                language_detected=str(d.get("language_detected") or ""),
                source_filename=str(d.get("source_filename") or ""),
                created_at=created_str,
            )
        )

    items.sort(key=lambda x: x.created_at or "", reverse=True)
    return DocumentListResponse(documents=items)


@router.get("/{doc_id}", response_model=AnalyzeResponse)
def get_analysis(
    doc_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    uid = _uid(current_user)
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid user")

    if not doc_id or doc_id.strip() != doc_id or len(doc_id) > 256:
        raise HTTPException(status_code=400, detail="Invalid document id")

    db = get_firestore_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")

    doc_ref = db.collection("documentAnalysis").document(uid).collection("documents").document(doc_id)
    snap = doc_ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Document not found")

    d = snap.to_dict() or {}
    created = d.get("created_at")
    if created is not None and hasattr(created, "isoformat"):
        created_str = created.isoformat()
    elif created is not None and hasattr(created, "timestamp"):
        created_str = datetime.fromtimestamp(created.timestamp(), tz=timezone.utc).isoformat()
    else:
        created_str = str(created or "")

    return AnalyzeResponse(
        id=doc_id,
        title=str(d.get("title") or d.get("source_filename") or "Untitled"),
        summary=str(d.get("summary") or ""),
        key_points=_normalize_str_list(d.get("key_points")),
        action_items=_normalize_str_list(d.get("action_items")),
        full_text=str(d.get("full_text") or ""),
        language_detected=str(d.get("language_detected") or ""),
        source_filename=str(d.get("source_filename") or ""),
        created_at=created_str,
    )


@router.delete("/{doc_id}")
def delete_analysis(
    doc_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    uid = _uid(current_user)
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid user")

    if not doc_id or doc_id.strip() != doc_id or len(doc_id) > 256:
        raise HTTPException(status_code=400, detail="Invalid document id")

    db = get_firestore_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")

    doc_ref = db.collection("documentAnalysis").document(uid).collection("documents").document(doc_id)
    snap = doc_ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Document not found")

    doc_ref.delete()
    return {"ok": True, "id": doc_id}
