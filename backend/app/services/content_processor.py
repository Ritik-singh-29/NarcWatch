"""Content processing and lightweight signal extraction.

Per the brief, keyword matching is NOT the primary detection mechanism — the LLM
is. These signals only feed the deterministic risk engine as a secondary,
corroborating input (commercial/shipping/payment context), and are intentionally
generic rather than a narcotics dictionary.
"""
from __future__ import annotations

import re
from typing import Dict, List

from app.schemas.analysis import RiskIndicators
from app.services.scraper import ScrapedPage

# These lists describe *commerce context*, not substances. The AI decides intent.
_SHIPPING_TERMS = [
    "worldwide shipping", "discreet shipping", "discreet packaging", "free shipping",
    "next day delivery", "tracked delivery", "ships from", "overnight delivery",
]
_PAYMENT_TERMS = [
    "bitcoin", "btc", "monero", "xmr", "crypto", "cryptocurrency", "gift card",
    "western union", "cash app", "escrow", "add to cart", "checkout", "buy now",
]
_MARKETING_TERMS = [
    "premium quality", "best price", "lab tested", "top shelf", "guaranteed",
    "limited stock", "wholesale", "bulk order", "loyalty points",
]
_COMMERCIAL_TERMS = [
    "price", "$", "usd", "in stock", "out of stock", "sku", "add to basket",
    "quantity", "cart", "order now", "subscribe & save",
]


def _count(text: str, terms: List[str]) -> int:
    return sum(len(re.findall(re.escape(t), text)) for t in terms)


def build_content_block(page: ScrapedPage) -> str:
    """Assemble a compact, structured block for the LLM prompt."""
    parts: List[str] = [f"URL: {page.url}"]
    if page.title:
        parts.append(f"TITLE: {page.title}")
    if page.meta_description:
        parts.append(f"META_DESCRIPTION: {page.meta_description}")
    if page.nav_items:
        parts.append("NAVIGATION: " + " | ".join(page.nav_items))
    if page.product_names:
        parts.append("PRODUCT_CANDIDATES: " + " | ".join(page.product_names))
    if page.headings:
        parts.append("HEADINGS: " + " | ".join(page.headings[:40]))
    if page.paragraphs:
        parts.append("BODY:\n" + "\n".join(page.paragraphs[:120]))
    return "\n".join(parts)


def extract_indicators(page: ScrapedPage) -> RiskIndicators:
    """Count generic commerce/logistics signals for the risk engine."""
    haystack = " ".join(
        [page.title, page.meta_description, *page.headings, *page.paragraphs,
         *page.nav_items, *page.product_names]
    ).lower()

    return RiskIndicators(
        commercial_indicators=_count(haystack, _COMMERCIAL_TERMS),
        shipping_indicators=_count(haystack, _SHIPPING_TERMS),
        payment_indicators=_count(haystack, _PAYMENT_TERMS),
        marketing_indicators=_count(haystack, _MARKETING_TERMS),
        drug_references=0,  # filled from the AI verdict, not keyword lists
    )


def tally_substances(names: List[str], page: ScrapedPage) -> Dict[str, int]:
    """Count how often each AI-detected substance appears in the scraped text."""
    haystack = " ".join(
        [page.title, page.meta_description, *page.headings, *page.paragraphs,
         *page.product_names]
    ).lower()
    tally: Dict[str, int] = {}
    for name in names:
        n = name.strip().lower()
        if not n:
            continue
        count = len(re.findall(re.escape(n), haystack))
        tally[name.strip()] = max(count, 1)
    return tally
