"""
Validators for chat-related input data.
"""

def validate_prompt(prompt: str) -> str:
    """
    Ensure the prompt is non-empty and well-formatted.
    """
    if not prompt or len(prompt.strip()) == 0:
        raise ValueError("Prompt cannot be empty")
    return prompt.strip()
