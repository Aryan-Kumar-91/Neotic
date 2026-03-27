"""
Service for interacting with Google Gemini models and generating Chain-of-Thought responses.
"""

import base64
import json
import re
from typing import List, Optional

import google.generativeai as google_genai
from src.config.env import GOOGLE_API_KEY
from src.types.schemas import FileData

google_genai.configure(api_key=GOOGLE_API_KEY)

# [DYNAMIC MODEL SELECTION]
# Auto-bind to the best available model that supports generateContent.
# Prefer 'flash' models for speed.
DEFAULT_MODEL_NAME = 'models/gemini-2.0-flash'
try:
    for model_meta in google_genai.list_models():
        if 'generateContent' in model_meta.supported_generation_methods:
            if 'flash' in model_meta.name:
                DEFAULT_MODEL_NAME = model_meta.name
                break
except Exception as list_error:
    print(f"Warning: Could not list models ({list_error}), falling back to {DEFAULT_MODEL_NAME}")

print(f"SUCCESS: Bound AI to model: {DEFAULT_MODEL_NAME}")
AI_MODEL = google_genai.GenerativeModel(DEFAULT_MODEL_NAME)

def generate_thoughts(prompt: str, files: Optional[List[FileData]] = None) -> dict:
    """
    Generate structured Chain-of-Thought reasoning using the Gemini API.
    """
    system_instr = (
        'Respond ONLY with JSON. Schema: '
        '{"thoughts": [{"step": "Analysis", "content": "..."}], "final_answer": "..."}'
    )

    if files:
        has_images = any(f.mime_type.startswith("image/") for f in files)
        if has_images:
            system_instr += (
                '\nThe user has attached image(s). You MUST analyze and '
                'describe the image content in your reasoning steps.'
            )

    full_prompt = f"{system_instr}\n\nUser Question: {prompt}"

    # Build content parts for multimodal requests
    content_parts = [full_prompt]

    if files:
        for f_data in files:
            try:
                f_bytes = base64.b64decode(f_data.data)
                f_mime = f_data.mime_type

                if f_mime.startswith("image/"):
                    # google.generativeai SDK expects: {"mime_type": str, "data": bytes}
                    content_parts.append({
                        "mime_type": f_mime,
                        "data": f_bytes
                    })
                    print(f"✓ Attached image: {f_data.name} ({f_mime}, {len(f_bytes)} bytes)")
                else:
                    # Text-based files: decode and inject into prompt
                    try:
                        text_val = f_bytes.decode("utf-8")
                        content_parts[0] += (
                            f"\n\n--- Attached File: {f_data.name} ---\n"
                            f"{text_val}\n--- End of {f_data.name} ---"
                        )
                        print(f"✓ Attached text file: {f_data.name} ({f_mime}, {len(text_val)} chars)")
                    except UnicodeDecodeError:
                        content_parts[0] += (
                            f"\n\n[Binary file attached: {f_data.name} "
                            f"({f_mime}, {len(f_bytes)} bytes) - cannot display content]"
                        )
                        print(f"⚠ Binary file (not readable): {f_data.name} ({f_mime})")
            except Exception as file_err:
                print(f"⚠ Failed to process file {f_data.name}: {file_err}")

    print(f"→ Sending {len(content_parts)} part(s) to Gemini...")
    response = AI_MODEL.generate_content(content_parts)
    print(f"✓ AI Response received for: {prompt[:30]}...")

    # [PARSER] Sanitizing markdown wrappers to extract raw JSON
    clean_text = re.sub(r'```json|```', '', response.text).strip()
    match = re.search(r'\{.*\}', clean_text, re.DOTALL)

    if not match:
        return {"thoughts": [], "final_answer": response.text}

    try:
        data = json.loads(match.group(0))
        # Ensure it has the correct structure
        if "thoughts" not in data or "final_answer" not in data:
            return {"thoughts": [], "final_answer": response.text}
        return data
    except Exception:
        return {"thoughts": [], "final_answer": response.text}
