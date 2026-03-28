"""
Controller for handling high-level chat processing logic.
"""

from typing import List, Optional
from src.services.geminiservice import generate_thoughts
from src.validators.chatvalidator import validate_prompt
from src.types.schemas import FileData

async def process_chat(prompt: str, files: Optional[List[FileData]] = None):
    """
    Validate input, invoke the thought generation service, and return a response.
    """
    valid_prompt = validate_prompt(prompt)
    raw_response = generate_thoughts(valid_prompt, files)
    return raw_response
