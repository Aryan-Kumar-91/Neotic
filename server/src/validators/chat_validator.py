def validate_prompt(prompt: str) -> str:
    if not prompt or len(prompt.strip()) == 0:
        raise ValueError("Prompt cannot be empty")
    return prompt.strip()
