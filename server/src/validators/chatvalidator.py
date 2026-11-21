"""
Validators for chat-related input data and payload boundaries.
"""

from typing import List, Optional
from src.types.schemas import FileData

MAX_PROMPT_LENGTH = 32_000
MAX_FILES_COUNT = 10
MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB base64 payload


def validate_prompt(prompt: str) -> str:
    """
    Ensure the prompt is non-empty, within size bounds, and well-formatted.
    """
    if not prompt or not prompt.strip():
        raise ValueError("Prompt cannot be empty")
    cleaned = prompt.strip()
    if len(cleaned) > MAX_PROMPT_LENGTH:
        raise ValueError(
            f"Prompt exceeds maximum allowed length of {MAX_PROMPT_LENGTH} characters"
        )
    return cleaned


def validate_files(files: Optional[List[FileData]]) -> None:
    """
    Validate attached files count and data size limits.
    """
    if not files:
        return
    if len(files) > MAX_FILES_COUNT:
        raise ValueError(f"Maximum {MAX_FILES_COUNT} files can be attached per request")
    for file in files:
        if not file.name or not file.name.strip():
            raise ValueError("Attached file must have a non-empty name")
        if len(file.data) > MAX_FILE_BYTES:
            raise ValueError(
                f"File '{file.name}' exceeds the maximum allowed size limit of 10 MB"
            )
