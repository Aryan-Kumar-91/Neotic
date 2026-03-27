import json
from typing import List, Optional
from src.services.gemini_service import generate_thoughts
from src.validators.chat_validator import validate_prompt
from src._types.schemas import FileData

async def process_chat(prompt: str, files: Optional[List[FileData]] = None):
    valid_prompt = validate_prompt(prompt)
    raw_response = generate_thoughts(valid_prompt, files)
    
    if isinstance(raw_response, dict):
        return raw_response
        
    try:
        data = json.loads(raw_response)
        if "thoughts" not in data or "final_answer" not in data:
            return {"thoughts": [], "final_answer": raw_response}
        return data
    except json.JSONDecodeError:
        return {"thoughts": [], "final_answer": raw_response}
