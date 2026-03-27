from pydantic import BaseModel
from typing import List, Optional

class FileData(BaseModel):
    name: str
    mime_type: str
    data: str  # base64 encoded

class ChatRequest(BaseModel):
    prompt: str
    files: Optional[List[FileData]] = None
