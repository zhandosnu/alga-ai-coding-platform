from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import hint, analyze, health
import uvicorn

app = FastAPI(
    title="Alga AI Service",
    description="LLM-powered hint generation and code analysis for the Alga platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hint.router, tags=["Hints"])
app.include_router(analyze.router, tags=["Analysis"])
app.include_router(health.router, tags=["Health"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
