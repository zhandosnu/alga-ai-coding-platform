import os
import ollama
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "glm4")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "120"))

# Initialize ollama client pointing at the local Ollama service
_client = ollama.Client(host=OLLAMA_BASE_URL)

# Supported local models (pull via: docker exec alga-ollama ollama pull <model>)
SUPPORTED_MODELS = [
    "glm4",               # GLM-4 9B — general purpose, strong coder
    "deepseek-coder:6.7b",# DeepSeek Coder — best for competitive programming
    "deepseek-r1:7b",     # DeepSeek R1 — chain-of-thought reasoning
    "gemma3:4b",          # Gemma 3 4B — lightweight, fast
    "gemma3:12b",         # Gemma 3 12B — higher quality
    "qwen2.5-coder:7b",   # Qwen 2.5 Coder — strong code model
    "codellama:7b",       # Code Llama — Meta's code model
]


def get_model() -> str:
    return OLLAMA_MODEL


def chat(
    system_prompt: str,
    messages: List[Dict[str, str]],
    model: str = None,
) -> str:
    """Send a chat request to the local Ollama instance and return the response text."""
    model = model or OLLAMA_MODEL

    ollama_messages = [{"role": "system", "content": system_prompt}] + messages

    try:
        response = _client.chat(
            model=model,
            messages=ollama_messages,
            options={
                "temperature": 0.7,
                "num_predict": 1024,
            },
        )
        return response["message"]["content"]
    except Exception as e:
        logger.error(f"Ollama error (model={model}): {e}")
        raise


def list_models() -> List[str]:
    """List all models currently pulled in the local Ollama instance."""
    try:
        models = _client.list()
        pulled = [m["model"] for m in models.get("models", [])]
        return pulled if pulled else SUPPORTED_MODELS
    except Exception as e:
        logger.error(f"Failed to list Ollama models: {e}")
        return SUPPORTED_MODELS
