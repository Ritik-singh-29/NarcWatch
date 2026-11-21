"""Weighted risk scoring engine.

Blends the AI's holistic risk_score (dominant weight) with corroborating
deterministic commerce signals. The AI drives the verdict; signals nudge it and
guard against an over-confident model missing obvious storefront mechanics.
"""
from __future__ import annotations

from app.schemas.analysis import AIAssessment, RiskIndicators, RiskLevel

# AI opinion dominates; signals contribute a bounded corroboration bonus.
_AI_WEIGHT = 0.80
_SIGNAL_WEIGHT = 0.20

# Per-signal caps (a handful of hits saturates; avoids runaway counts).
_SIGNAL_CAPS = {
    "commercial_indicators": 8,
    "shipping_indicators": 4,
    "payment_indicators": 5,
    "marketing_indicators": 5,
}
# How much each fully-saturated signal contributes to the 0-100 signal score.
_SIGNAL_CONTRIB = {
    "commercial_indicators": 15,
    "shipping_indicators": 30,
    "payment_indicators": 35,
    "marketing_indicators": 20,
}


def _signal_score(indicators: RiskIndicators) -> float:
    total = 0.0
    for field, cap in _SIGNAL_CAPS.items():
        value = getattr(indicators, field)
        ratio = min(value, cap) / cap if cap else 0
        total += ratio * _SIGNAL_CONTRIB[field]
    return min(total, 100.0)


def _level(score: int) -> RiskLevel:
    if score <= 20:
        return RiskLevel.safe
    if score <= 40:
        return RiskLevel.low
    if score <= 60:
        return RiskLevel.moderate
    if score <= 80:
        return RiskLevel.high
    return RiskLevel.critical


def compute(assessment: AIAssessment, indicators: RiskIndicators) -> tuple[int, RiskLevel]:
    """Return (final_risk_score, risk_level)."""
    signal = _signal_score(indicators)
    blended = _AI_WEIGHT * assessment.risk_score + _SIGNAL_WEIGHT * signal

    # If the AI sees a clear educational/medical/research context, dampen the
    # commerce-signal contribution so an ad-heavy news page isn't over-scored.
    benign_types = {"Educational", "Medical", "News", "Research", "Government", "Harm Reduction", "Blog"}
    if assessment.website_type in benign_types and assessment.risk_score <= 40:
        blended = min(blended, assessment.risk_score + 5)

    final = int(round(max(0, min(100, blended))))
    return final, _level(final)
