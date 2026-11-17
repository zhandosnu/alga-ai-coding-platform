from fastapi import APIRouter
from app.services import ollama_service

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "alga-ai-service",
        "model": ollama_service.get_model(),
    }


@router.get("/models")
async def list_models():
    """List all models available in the local Ollama instance."""
    return {
        "current_model": ollama_service.get_model(),
        "available": ollama_service.list_models(),
    }
