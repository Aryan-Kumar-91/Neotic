"""
Validators for chat-related input data.
"""

def validate_prompt(prompt: str) -> str:
    """
    Ensure the prompt is non-empty and well-formatted.
    """
    if not prompt or not prompt.strip():
        raise ValueError("Prompt cannot be empty")
    return prompt.strip()
