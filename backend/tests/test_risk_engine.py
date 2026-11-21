"""Risk engine scoring behavior."""
from app.schemas.analysis import AIAssessment, RiskIndicators, RiskLevel
from app.services import risk_engine


def _ai(website_type, score, conf=90):
    return AIAssessment(website_type=website_type, purpose="x", risk_score=score,
                        confidence=conf, risk_level="x", summary="")


def test_benign_medical_stays_safe():
    score, level = risk_engine.compute(_ai("Medical", 15), RiskIndicators())
    assert level == RiskLevel.safe and score <= 20


def test_overt_marketplace_is_critical():
    ind = RiskIndicators(commercial_indicators=8, shipping_indicators=4,
                         payment_indicators=5, marketing_indicators=5, drug_references=6)
    score, level = risk_engine.compute(_ai("Drug Marketplace", 88), ind)
    assert level == RiskLevel.critical and score >= 81


def test_benign_type_dampens_signals():
    # A news page with commerce ads shouldn't be pushed high by signals alone.
    ind = RiskIndicators(commercial_indicators=8, payment_indicators=5)
    score, _ = risk_engine.compute(_ai("News", 30), ind)
    assert score <= 35
