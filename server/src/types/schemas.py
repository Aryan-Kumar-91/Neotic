"""
Pydantic schemas for request and response data models.
"""

from typing import List, Optional
from pydantic import BaseModel

# pylint: disable=too-few-public-methods

class FileData(BaseModel):
    """
    Schema representing a file attachment with base64 encoded data.
    """
    name: str
    mime_type: str
    data: str  # base64 encoded

class ChatRequest(BaseModel):
    """
    Schema for the main chat request body.
    """
    prompt: str
    files: Optional[List[FileData]] = None
