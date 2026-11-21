"""API contract schemas for NarcWatch analysis."""
from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    safe = "Safe"
    low = "Low Risk"
    moderate = "Moderate Risk"
    high = "High Risk"
    critical = "Critical Risk"


class AnalyzeRequest(BaseModel):
    url: str = Field(..., examples=["https://example.com"], max_length=2048)


class Evidence(BaseModel):
    snippet: str
    category: str = Field(description="drug|commercial|shipping|payment|marketing|other")
    reason: str


class SubstanceMention(BaseModel):
    name: str
    mentions: int


class RiskIndicators(BaseModel):
    """Rule-derived signal counts used by the deterministic risk engine."""
    drug_references: int = 0
    commercial_indicators: int = 0
    shipping_indicators: int = 0
    payment_indicators: int = 0
    marketing_indicators: int = 0


class AIAssessment(BaseModel):
    """Raw structured verdict returned by the LLM (Gemini or Groq)."""
    website_type: str
    purpose: str
    risk_score: int = Field(ge=0, le=100)
    confidence: int = Field(ge=0, le=100)
    risk_level: str
    substances_detected: List[str] = []
    suspicious_indicators: List[str] = []
    evidence: List[str] = []
    summary: str


class ScrapeMeta(BaseModel):
    title: Optional[str] = None
    meta_description: Optional[str] = None
    headings: List[str] = []
    nav_items: List[str] = []
    internal_links: List[str] = []
    product_names: List[str] = []
    content_chars: int = 0


class AnalysisResult(BaseModel):
    """Full result returned by POST /analyze and GET /analysis/{id}."""
    id: str
    url: str
    provider: str = Field(description="gemini | groq")
    website_type: str
    purpose: str
    final_risk_score: int = Field(ge=0, le=100)
    confidence: int = Field(ge=0, le=100)
    risk_level: RiskLevel
    substances_detected: List[SubstanceMention] = []
    suspicious_indicators: List[str] = []
    risk_indicators: RiskIndicators
    evidence: List[Evidence] = []
    summary: str
    scrape_meta: ScrapeMeta
    created_at: str


class HealthResponse(BaseModel):
    status: str = "ok"
    app: str
    gemini_configured: bool
    groq_configured: bool


class AnalysisSummary(BaseModel):
    """Lightweight row for the Reports list view."""
    id: str
    url: str
    provider: str
    website_type: str
    risk_score: int
    confidence: int
    risk_level: str
    created_at: str
