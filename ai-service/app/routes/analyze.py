from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services import ollama_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class AnalysisContext(BaseModel):
    verdict: str
    passed: int
    total: int
    problemTitle: str
    errorMessage: Optional[str] = None


class AnalyzeRequest(BaseModel):
    code: str
    language: str
    context: Optional[AnalysisContext] = None


class AnalyzeResponse(BaseModel):
    analysis: str
    model: str


ANALYZE_SYSTEM_PROMPT = """You are an expert competitive programming coach giving concise, educational code feedback.

Your job is to help students learn from their submission results. Be:
- Specific and actionable — point to concrete issues or improvements
- Educational — explain *why* something is wrong or could be better
- Encouraging — even for wrong answers, stay positive and constructive
- Concise — maximum 3-4 short paragraphs, no fluff

Do NOT give the full solution. If the code is correct (AC), still suggest style or efficiency improvements.
Format your response in clean Markdown."""


def build_analysis_prompt(code: str, language: str, ctx: AnalysisContext | None) -> str:
    lang_name = "C++" if language == "cpp" else "Python"

    if ctx:
        verdict_descriptions = {
            "AC": "✅ Accepted — all test cases passed",
            "WA": "❌ Wrong Answer — output didn't match expected",
            "TLE": "⏱ Time Limit Exceeded — solution is too slow",
            "CE": "🔴 Compilation Error",
            "RE": "💥 Runtime Error — crashed during execution",
            "MLE": "💾 Memory Limit Exceeded",
        }
        verdict_str = verdict_descriptions.get(ctx.verdict, ctx.verdict)
        prompt = (
            f"**Problem:** {ctx.problemTitle}\n"
            f"**Result:** {verdict_str} ({ctx.passed}/{ctx.total} test cases passed)\n"
        )
        if ctx.errorMessage:
            prompt += f"**Error message:**\n```\n{ctx.errorMessage[:500]}\n```\n"
        prompt += f"\n**{lang_name} Code:**\n```{language}\n{code}\n```\n\n"
        prompt += "Please provide educational feedback on this submission."
    else:
        prompt = (
            f"Please analyze this {lang_name} code and provide educational feedback:\n\n"
            f"```{language}\n{code}\n```"
        )
    return prompt


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_code(request: AnalyzeRequest) -> AnalyzeResponse:
    """Analyze student code after a submission and return educational feedback."""
    try:
        user_message = build_analysis_prompt(request.code, request.language, request.context)

        analysis = ollama_service.chat(
            system_prompt=ANALYZE_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )

        return AnalyzeResponse(
            analysis=analysis,
            model=ollama_service.get_model(),
        )
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")
