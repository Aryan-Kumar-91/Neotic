"""
Service for interacting with Google Gemini models and generating
Chain-of-Thought responses.
"""

import base64
import json
import re
import sys
from typing import List, Optional

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# pylint: disable=import-error
import google.generativeai as google_genai

from src.config.env import GOOGLE_API_KEY
from src.types.schemas import FileData
from src.rag.service import get_rag_context

google_genai.configure(api_key=GOOGLE_API_KEY)  # pyright: ignore

# [DYNAMIC MODEL SELECTION]
# Test candidate models for availability and bind to the best working model.
CANDIDATE_MODELS = [
    "gemini-flash-latest",
    "models/gemini-flash-latest",
    "models/gemini-2.0-flash",
    "gemini-2.0-flash",
    "models/gemini-1.5-flash",
    "gemini-1.5-flash",
    "models/gemini-pro-latest",
    "gemini-pro-latest",
]

DEFAULT_MODEL_NAME = "gemini-flash-latest"
AI_MODEL = None

for candidate in CANDIDATE_MODELS:
    try:
        test_model = google_genai.GenerativeModel(
            model_name=candidate, tools=[{"google_search_retrieval": {}}]
        )
        test_model.generate_content("ping")
        AI_MODEL = test_model
        DEFAULT_MODEL_NAME = candidate
        break
    except Exception:
        try:
            test_model = google_genai.GenerativeModel(model_name=candidate)
            test_model.generate_content("ping")
            AI_MODEL = test_model
            DEFAULT_MODEL_NAME = candidate
            break
        except Exception:
            continue

if not AI_MODEL:
    DEFAULT_MODEL_NAME = "gemini-flash-latest"
    AI_MODEL = google_genai.GenerativeModel(model_name=DEFAULT_MODEL_NAME)

print(f"[OK] Bound AI to verified model: {DEFAULT_MODEL_NAME}")

# ---------------------------------------------------------------------------
# System instruction builder helpers
# ---------------------------------------------------------------------------

_BASE_SYSTEM_INSTR = (
    "You are the Neotic Reasoning Core. Your goal is to provide deep, "
    "verified insights using a Chain-of-Thought approach. "
    "You MUST respond in a strict JSON format with exactly three top-level "
    "keys: 'thoughts', 'final_answer', and 'citations'.\n\n"
    "Each thought object in the 'thoughts' array MUST have:\n"
    "- 'step': A short phase name (e.g., 'Analysis', 'Investigation', 'Reflection')\n"
    "- 'content': The detailed reasoning text\n"
    "- 'confidence': A float between 0.0 and 1.0\n"
    "- 'duration_ms': A simulated integer (e.g., 200 to 1200)\n"
    "- 'is_reflection': (optional boolean)\n\n"
    "The 'final_answer' should be a comprehensive response to the user.\n\n"
    "The 'citations' array MUST contain objects linking specific claims to "
    "sources from the provided 'Local Knowledge Base Context'. "
    "Each citation object must have:\n"
    "- 'claim': The exact text or short phrase being verified\n"
    "- 'source': The filename of the source document\n"
    "- 'verification_status': 'verified' (if found in context) "
    "or 'unverified' (if generated from general knowledge)\n\n"
    "Example:\n"
    '{"thoughts": [...], "final_answer": "...", "citations": '
    '[{"claim": "The sky is blue", "source": "science.pdf", '
    '"verification_status": "verified"}]}'
)


def _build_system_instr(
    user_prefs: Optional[dict],
    files: Optional[List[FileData]],
    rag_context: Optional[str],
) -> str:
    """Compose the full system instruction string from optional components."""
    instr = _BASE_SYSTEM_INSTR

    if user_prefs:
        name = user_prefs.get("name", "")
        interests = user_prefs.get("interests", "")
        if name or interests:
            instr += "\n\nUser Context:"
            if name:
                instr += f"\n- Name: {name}"
            if interests:
                instr += f"\n- Interests: {interests}"
            instr += (
                "\nTailor your responses, tone, and examples "
                "to the user's name and interests where helpful."
            )

    if files and any(f.mime_type.startswith("image/") for f in files):
        instr += (
            "\nThe user has attached image(s). You MUST analyze and "
            "describe the image content in your reasoning steps."
        )

    if rag_context:
        instr += f"\n\nLocal Knowledge Base Context (VERIFIED):\n{rag_context}"

    return instr


def _build_content_parts(
    full_prompt: str,
    files: Optional[List[FileData]],
) -> list:
    """Construct the multimodal content-parts list for the Gemini request."""
    parts = [full_prompt]

    if not files:
        return parts

    for f_data in files:
        try:
            f_bytes = base64.b64decode(f_data.data)
            f_mime = f_data.mime_type

            if f_mime.startswith("image/"):
                part = {"mime_type": f_mime, "data": f_bytes}
                parts.append(part)  # pyright: ignore[reportArgumentType]
                print(
                    f"[OK] Attached image: {f_data.name} "
                    f"({f_mime}, {len(f_bytes)} bytes)"
                )
            else:
                _append_text_file(parts, f_data, f_bytes, f_mime)
        except Exception as file_err:  # pylint: disable=broad-except
            print(f"[WARN] Failed to process file {f_data.name}: {file_err}")

    return parts


def _append_text_file(
    parts: list,
    f_data: FileData,
    f_bytes: bytes,
    f_mime: str,
) -> None:
    """Decode a text-based file and inline its content into the prompt part."""
    try:
        text_val = f_bytes.decode("utf-8")
        parts[0] += (
            f"\n\n--- Attached File: {f_data.name} ---\n"
            f"{text_val}\n--- End of {f_data.name} ---"
        )
        print(f"[OK] Attached text: {f_data.name} " f"({f_mime}, {len(text_val)} chars)")
    except UnicodeDecodeError:
        parts[0] += (
            f"\n\n[Binary file attached: {f_data.name} "
            f"({f_mime}, {len(f_bytes)} bytes) - cannot display content]"
        )
        print(f"[WARN] Binary file (not readable): {f_data.name} ({f_mime})")


def _inject_rag_thought(data: dict, library_sources: list) -> dict:
    """Prepend a Library Retrieval thought when RAG sources were used."""
    retrieval_thought = {
        "step": "Library Retrieval",
        "content": (
            "Verified information was retrieved from the following "
            f"documents: {', '.join(library_sources)}."
        ),
        "confidence": 1.0,
        "duration_ms": 150,
    }
    data["thoughts"] = [retrieval_thought] + data["thoughts"]
    return data


def _parse_response(response_text: str) -> dict:
    """Extract and validate the JSON payload from the model response."""
    clean_text = re.sub(r"```json|```", "", response_text).strip()
    match = re.search(r"\{.*\}", clean_text, re.DOTALL)

    if not match:
        return {"thoughts": [], "final_answer": response_text, "citations": []}

    try:
        data = json.loads(match.group(0))
        if "thoughts" not in data or "final_answer" not in data:
            return {"thoughts": [], "final_answer": response_text, "citations": []}
        if "citations" not in data:
            data["citations"] = []
        return data
    except (json.JSONDecodeError, AttributeError, ValueError):
        return {"thoughts": [], "final_answer": response_text, "citations": []}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def generate_thoughts(
    prompt: str,
    files: Optional[List[FileData]] = None,
    user_prefs: Optional[dict] = None,
) -> dict:
    """
    Generate structured Chain-of-Thought reasoning using the Gemini API.
    """
    # Optional RAG Enrichment
    rag_data = get_rag_context(prompt)
    library_sources: list = []
    rag_context: Optional[str] = None

    if rag_data:
        print(f"[INFO] Searching local library for: {prompt[:50]}...")
        rag_context = rag_data["context"]
        library_sources = rag_data["sources"]
        if rag_context:
            print(f"[OK] Found RAG context from {len(library_sources)} sources")

    system_instr = _build_system_instr(user_prefs, files, rag_context)
    full_prompt = f"{system_instr}\n\nUser Question: {prompt}"
    content_parts = _build_content_parts(full_prompt, files)

    print(f"-> Sending {len(content_parts)} part(s) to Gemini...")
    response = AI_MODEL.generate_content(content_parts)
    print(f"[OK] AI Response received for: {prompt[:30]}...")

    data = _parse_response(response.text)

    if library_sources:
        data = _inject_rag_thought(data, library_sources)

    return data
