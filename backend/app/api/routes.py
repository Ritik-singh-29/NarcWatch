"""API routes: POST /analyze, GET /analysis/{id}, GET /health."""
import logging

from fastapi import APIRouter, Body, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.security import UnsafeURLError
from app.schemas.analysis import AnalysisResult, AnalysisSummary, AnalyzeRequest, HealthResponse
from app.services import ai_analyzer, orchestrator, scraper

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/health", response_model=HealthResponse, tags=["system"])
async def health() -> HealthResponse:
    return HealthResponse(
        app=settings.app_name,
        gemini_configured=bool(settings.gemini_api_key),
        groq_configured=bool(settings.groq_api_key),
    )


@router.post("/analyze", response_model=AnalysisResult, tags=["analysis"])
@limiter.limit(settings.rate_limit)
async def analyze(request: Request, body: AnalyzeRequest = Body(...)) -> AnalysisResult:
    try:
        return await orchestrator.run_analysis(body.url)
    except UnsafeURLError as exc:
        raise HTTPException(status_code=422, detail=f"Invalid or unsafe URL: {exc}")
    except scraper.ScrapeError as exc:
        raise HTTPException(status_code=502, detail=f"Failed to access target site: {exc}")
    except ai_analyzer.AIError as exc:
        raise HTTPException(status_code=502, detail=f"AI analysis unavailable: {exc}")
    except Exception as exc:  # noqa: BLE001
        logger.exception("Analysis failed for %s", body.url)
        raise HTTPException(status_code=500, detail="Analysis failed. Please try again.") from exc


@router.get("/analyses", response_model=list[AnalysisSummary], tags=["analysis"])
async def list_analyses() -> list[AnalysisSummary]:
    return [AnalysisSummary(**row) for row in orchestrator.list_analyses()]


@router.get("/analysis/{analysis_id}", response_model=AnalysisResult, tags=["analysis"])
async def get_analysis(analysis_id: str) -> AnalysisResult:
    result = orchestrator.get_analysis(analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return result
