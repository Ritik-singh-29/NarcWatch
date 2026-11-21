"""AI analysis layer: Gemini (primary) with Groq (fallback).

Both providers are prompted for the identical strict-JSON schema. If Gemini is
unconfigured, errors, or returns unparseable output, we transparently fall back
to Groq. The returned tuple is (AIAssessment, provider_name).
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Tuple

from app.core.config import settings
from app.schemas.analysis import AIAssessment
from app.services.prompts import ANALYSIS_PROMPT, SYSTEM_INSTRUCTION

logger = logging.getLogger(__name__)

_JSON_RE = re.compile(r"\{.*\}", re.DOTALL)


class AIError(RuntimeError):
    pass


def _extract_json(text: str) -> dict:
    text = text.strip()
    # Strip code fences if the model added them despite instructions.
    text = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
    match = _JSON_RE.search(text)
    if not match:
        raise AIError("No JSON object found in model output.")
    return json.loads(match.group(0))


def _coerce(data: dict) -> AIAssessment:
    def clamp(v, lo=0, hi=100):
        try:
            return max(lo, min(hi, int(round(float(v)))))
        except (TypeError, ValueError):
            return lo

    return AIAssessment(
        website_type=str(data.get("website_type", "Other"))[:80],
        purpose=str(data.get("purpose", ""))[:400],
        risk_score=clamp(data.get("risk_score", 0)),
        confidence=clamp(data.get("confidence", 0)),
        risk_level=str(data.get("risk_level", "Safe"))[:40],
        substances_detected=[str(s)[:80] for s in (data.get("substances_detected") or [])][:40],
        suspicious_indicators=[str(s)[:160] for s in (data.get("suspicious_indicators") or [])][:40],
        evidence=[str(s)[:300] for s in (data.get("evidence") or [])][:40],
        summary=str(data.get("summary", ""))[:1200],
    )


async def _analyze_gemini(content: str) -> AIAssessment:
    if not settings.gemini_api_key:
        raise AIError("Gemini API key not configured.")

    import httpx

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
    )
    prompt = ANALYSIS_PROMPT.format(content=content)
    payload = {
        "system_instruction": {
            "parts": [{"text": SYSTEM_INSTRUCTION}],
        },
        "contents": [
            {
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "response_mime_type": "application/json",
        },
    }

    async with httpx.AsyncClient(timeout=25.0) as client:
        resp = await client.post(url, json=payload)
        if resp.is_error:
            try:
                err_data = resp.json()
                msg = err_data.get("error", {}).get("message", resp.text)
            except Exception:
                msg = resp.text
            raise AIError(f"Gemini API error ({resp.status_code}): {msg}")

        data = resp.json()
        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as exc:
            raise AIError(f"Unexpected Gemini response structure: {data}") from exc

        return _coerce(_extract_json(text))


async def _analyze_groq(content: str) -> AIAssessment:
    if not settings.groq_api_key:
        raise AIError("Groq API key not configured.")

    from groq import AsyncGroq

    client = AsyncGroq(api_key=settings.groq_api_key)
    resp = await asyncio.wait_for(
        client.chat.completions.create(
            model=settings.groq_model,
            temperature=0.1,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_INSTRUCTION},
                {"role": "user", "content": ANALYSIS_PROMPT.format(content=content)},
            ],
        ),
        timeout=25.0,
    )
    return _coerce(_extract_json(resp.choices[0].message.content))


async def analyze(content: str) -> Tuple[AIAssessment, str]:
    """Run analysis with Gemini, falling back to Groq on any failure."""
    gemini_err: Exception | None = None
    try:
        return await _analyze_gemini(content), "gemini"
    except Exception as exc:  # noqa: BLE001
        gemini_err = exc
        logger.warning("Gemini analysis failed (%s); falling back to Groq.", exc)

    try:
        return await _analyze_groq(content), "groq"
    except Exception as exc:  # noqa: BLE001
        logger.error("Groq analysis also failed (%s).", exc)
        raise AIError(f"All AI providers failed. Gemini: {gemini_err} | Groq: {exc}") from exc
