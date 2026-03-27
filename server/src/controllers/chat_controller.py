import json
from src.services.gemini_service import generate_thoughts
from src.validators.chat_validator import validate_prompt

async def process_chat(prompt: str):
    valid_prompt = validate_prompt(prompt)
    raw_response = generate_thoughts(valid_prompt)
    
    if isinstance(raw_response, dict):
        return raw_response
        
    try:
        data = json.loads(raw_response)
        if "thoughts" not in data or "final_answer" not in data:
            return {"thoughts": [], "final_answer": raw_response}
        return data
    except json.JSONDecodeError:
        return {"thoughts": [], "final_answer": raw_response}
