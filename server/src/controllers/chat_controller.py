import json
from typing import List, Optional
from src.services.gemini_service import generate_thoughts
from src.validators.chat_validator import validate_prompt
from src._types.schemas import FileData

async def process_chat(prompt: str, files: Optional[List[FileData]] = None):
    valid_prompt = validate_prompt(prompt)
    raw_response = generate_thoughts(valid_prompt, files)
    return raw_response
