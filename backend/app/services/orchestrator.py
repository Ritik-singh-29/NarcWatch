"""Orchestrates the full analysis pipeline and stores results.

MVP uses an in-memory store (see database decision in README). The store is
trivially swappable for Cloud SQL / Firestore behind the same interface.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from app.core.security import validate_url
from app.schemas.analysis import (
    AnalysisResult,
    Evidence,
    ScrapeMeta,
    SubstanceMention,
)
from app.services import ai_analyzer, content_processor, repository, risk_engine, scraper


def _categorize_evidence(snippet: str) -> str:
    s = snippet.lower()
    if any(t in s for t in ["ship", "delivery", "packaging", "discreet"]):
        return "shipping"
    if any(t in s for t in ["btc", "bitcoin", "monero", "crypto", "escrow", "gift card", "checkout", "cart"]):
        return "payment"
    if any(t in s for t in ["premium", "best price", "guaranteed", "top shelf", "lab tested"]):
        return "marketing"
    if any(t in s for t in ["price", "$", "buy", "order", "in stock"]):
        return "commercial"
    return "drug"


async def run_analysis(raw_url: str) -> AnalysisResult:
    url = validate_url(raw_url)

    page = await scraper.scrape(url)
    content_block = content_processor.build_content_block(page)
    indicators = content_processor.extract_indicators(page)

    assessment, provider = await ai_analyzer.analyze(content_block)

    # Feed the AI's drug findings back into the indicator set.
    indicators.drug_references = len(assessment.substances_detected) + len(
        assessment.suspicious_indicators
    )

    final_score, level = risk_engine.compute(assessment, indicators)

    substance_tally = content_processor.tally_substances(
        assessment.substances_detected, page
    )
    substances = [
        SubstanceMention(name=name, mentions=count)
        for name, count in sorted(substance_tally.items(), key=lambda kv: -kv[1])
    ]

    evidence = [
        Evidence(snippet=snippet, category=_categorize_evidence(snippet), reason="AI-flagged")
        for snippet in assessment.evidence
    ]

    result = AnalysisResult(
        id=str(uuid.uuid4()),
        url=url,
        provider=provider,
        website_type=assessment.website_type,
        purpose=assessment.purpose,
        final_risk_score=final_score,
        confidence=assessment.confidence,
        risk_level=level,
        substances_detected=substances,
        suspicious_indicators=assessment.suspicious_indicators,
        risk_indicators=indicators,
        evidence=evidence,
        summary=assessment.summary,
        scrape_meta=ScrapeMeta(
            title=page.title or None,
            meta_description=page.meta_description or None,
            headings=page.headings[:20],
            nav_items=page.nav_items[:20],
            internal_links=page.internal_links[:20],
            product_names=page.product_names[:20],
            content_chars=len(page.clean_text),
        ),
        created_at=datetime.now(timezone.utc).isoformat(),
    )

    repository.save(result)
    return result


def get_analysis(analysis_id: str) -> Optional[AnalysisResult]:
    return repository.get(analysis_id)


def list_analyses(limit: int = 50) -> list[dict]:
    return repository.list_recent(limit)
