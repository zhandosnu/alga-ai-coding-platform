from pydantic import BaseModel
from typing import Optional, List


class Message(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class HintRequest(BaseModel):
    problem_title: str
    problem_description: str
    user_code: str = ""
    language: str = "python"
    hint_level: int = 1  # 1=gentle, 2=medium, 3=direct
    conversation_history: List[Message] = []


class HintResponse(BaseModel):
    hint: str
    model: str


class AnalyzeRequest(BaseModel):
    code: str
    language: str = "python"


class AnalyzeResponse(BaseModel):
    analysis: str
    model: str
