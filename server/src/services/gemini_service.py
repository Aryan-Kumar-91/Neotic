import google.generativeai as genai
import re
import base64
import json
from typing import List, Optional
from src.config.env import GOOGLE_API_KEY
from src._types.schemas import FileData

genai.configure(api_key=GOOGLE_API_KEY)

# [DYNAMIC MODEL SELECTION] 
# Auto-bind to the best available model that supports generateContent.
# Prefer 'flash' models for speed. All modern Gemini models support multimodal input natively.
default_model_name = 'models/gemini-2.0-flash'  # Sensible default
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            if 'flash' in m.name:
                default_model_name = m.name
                break
except Exception as e:
    print(f"Warning: Could not list models ({e}), falling back to {default_model_name}")

print(f"SUCCESS: Bound AI to model: {default_model_name}")
model = genai.GenerativeModel(default_model_name)

def generate_thoughts(prompt: str, files: Optional[List[FileData]] = None) -> dict:
    # [PROMPT ENGINEERING] Strictly injecting a JSON structural directive into the system prompt.
    system_instr = 'Respond ONLY with JSON. Schema: {"thoughts": [{"step": "Analysis", "content": "..."}], "final_answer": "..."}'
    
    if files:
        has_images = any(f.mime_type.startswith("image/") for f in files)
        if has_images:
            system_instr += '\nThe user has attached image(s). You MUST analyze and describe the image content in your reasoning steps.'
    
    full_prompt = f"{system_instr}\n\nUser Question: {prompt}"
    
    # Build content parts for multimodal requests
    content_parts = [full_prompt]
    
    if files:
        for file in files:
            try:
                file_bytes = base64.b64decode(file.data)
                mime = file.mime_type
                
                if mime.startswith("image/"):
                    # google.generativeai SDK expects: {"mime_type": str, "data": bytes}
                    content_parts.append({
                        "mime_type": mime,
                        "data": file_bytes
                    })
                    print(f"✓ Attached image: {file.name} ({mime}, {len(file_bytes)} bytes)")
                else:
                    # Text-based files: decode and inject into prompt
                    try:
                        text_content = file_bytes.decode("utf-8")
                        content_parts[0] += f"\n\n--- Attached File: {file.name} ---\n{text_content}\n--- End of {file.name} ---"
                        print(f"✓ Attached text file: {file.name} ({mime}, {len(text_content)} chars)")
                    except UnicodeDecodeError:
                        content_parts[0] += f"\n\n[Binary file attached: {file.name} ({mime}, {len(file_bytes)} bytes) - cannot display content]"
                        print(f"⚠ Binary file (not readable): {file.name} ({mime})")
            except Exception as e:
                print(f"⚠ Failed to process file {file.name}: {e}")
    
    print(f"→ Sending {len(content_parts)} part(s) to Gemini...")
    response = model.generate_content(content_parts)
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
