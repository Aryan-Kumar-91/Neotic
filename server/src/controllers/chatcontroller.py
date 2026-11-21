"""
Controller for handling high-level chat processing logic.
"""

import asyncio
import json
from typing import AsyncGenerator, List, Optional
from src.services.geminiservice import generate_thoughts
from src.validators.chatvalidator import validate_prompt, validate_files
from src.types.schemas import FileData


async def process_chat(
    prompt: str,
    files: Optional[List[FileData]] = None,
    user_prefs: Optional[dict] = None,
):
    """
    Validate input, invoke the thought generation service, and return a response.
    """
    valid_prompt = validate_prompt(prompt)
    validate_files(files)
    raw_response = generate_thoughts(valid_prompt, files, user_prefs)
    return raw_response


async def stream_chat(
    prompt: str,
    files: Optional[List[FileData]] = None,
    user_prefs: Optional[dict] = None,
) -> AsyncGenerator[str, None]:
    """
    Validate input, stream progressive reasoning thoughts, and yield final response.
    """
    valid_prompt = validate_prompt(prompt)
    validate_files(files)

    # Emit initial decomposition phase so the DAG renders immediately
    initial_thought = {
        "step": "Decomposition",
        "content": f"Deconstructing question: '{valid_prompt[:60]}...'",
        "confidence": 0.98,
        "duration_ms": 250,
    }
    yield f"event: thought\ndata: {json.dumps(initial_thought)}\n\n"
    await asyncio.sleep(0.05)

    # Run AI generation in executor to avoid blocking the event loop
    loop = asyncio.get_running_loop()
    raw_response = await loop.run_in_executor(
        None, generate_thoughts, valid_prompt, files, user_prefs
    )

    thoughts = raw_response.get("thoughts", [])
    for thought in thoughts:
        if thought.get("step") != "Decomposition":
            yield f"event: thought\ndata: {json.dumps(thought)}\n\n"
            await asyncio.sleep(0.05)

    final_answer = raw_response.get("final_answer", "")
    citations = raw_response.get("citations", [])

    done_payload = {
        "final_answer": final_answer,
        "thoughts": thoughts if thoughts else [initial_thought],
        "citations": citations,
    }
    yield f"event: done\ndata: {json.dumps(done_payload)}\n\n"
