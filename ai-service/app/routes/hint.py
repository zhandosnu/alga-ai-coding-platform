from fastapi import APIRouter, HTTPException
from app.schemas.schemas import HintRequest, HintResponse
from app.services import ollama_service
from app.prompts.hint_system_prompt import HINT_SYSTEM_PROMPT, get_hint_prompt
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/hint", response_model=HintResponse)
async def get_hint(request: HintRequest) -> HintResponse:
    """Generate a Socratic hint for a competitive programming problem."""
    try:
        user_message = get_hint_prompt(
            problem_title=request.problem_title,
            problem_description=request.problem_description,
            user_code=request.user_code,
            language=request.language,
            hint_level=request.hint_level,
        )

        # Build conversation history (last 6 messages for context window)
        messages = []
        for msg in request.conversation_history[-6:]:
            messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": user_message})

        hint_text = ollama_service.chat(
            system_prompt=HINT_SYSTEM_PROMPT,
            messages=messages,
        )

        return HintResponse(
            hint=hint_text,
            model=ollama_service.get_model(),
        )
    except Exception as e:
        logger.error(f"Hint generation error: {e}")
        raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")
