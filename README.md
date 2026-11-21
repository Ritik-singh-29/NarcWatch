# NarcWatch

AI-powered website intelligence and controlled-substance risk analysis. A user enters a URL; NarcWatch scrapes the public content, uses contextual AI (Gemini primary, Groq fallback) to judge the site's **intent**, and returns a weighted risk score with evidence and charts.

The core philosophy: **context, not keywords.** A cannabis research paper, a harm-reduction guide, and a licensed pharmacy are low risk; a storefront selling THC gummies with crypto checkout and discreet worldwide shipping is critical risk. The LLM makes that distinction; keyword signals only corroborate it.

---

## Architecture

```
                    ┌─────────────────────────────────────────────┐
   Browser  ──────► │  Frontend (React + Vite + TS + Tailwind)     │
                    │  Landing • Analyze • Results • Reports • About│
                    └───────────────┬─────────────────────────────┘
                                    │  POST /api/analyze  { url }
                                    ▼
                    ┌─────────────────────────────────────────────┐
                    │  Backend (FastAPI, Python 3.12)              │
                    │                                              │
                    │  routes → orchestrator ─┬─► security (SSRF)  │
                    │                         ├─► scraper          │
                    │                         │     Playwright     │
                    │                         │     └► httpx (fb)  │
                    │                         ├─► content_processor│
                    │                         ├─► ai_analyzer      │
                    │                         │     Gemini ─► Groq │
                    │                         └─► risk_engine      │
                    │                              (weighted)      │
                    └───────────────┬─────────────────────────────┘
                                    │  AnalysisResult (JSON)
                                    ▼
                          in-memory store  (→ Cloud SQL later)
```

**Request flow:** validate URL (SSRF-safe) → scrape (Playwright, httpx fallback) → clean & structure content → extract commerce signals → AI verdict (strict JSON) → weighted risk score → store → return structured result → dashboard renders gauge + 5 charts + evidence.

---

## Folder structure

```
narcwatch/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app, CORS, security headers, rate limiter
│   │   ├── api/routes.py           # /analyze, /analysis/{id}, /health
│   │   ├── core/
│   │   │   ├── config.py           # pydantic-settings
│   │   │   └── security.py         # URL validation + SSRF protection
│   │   ├── schemas/analysis.py     # Pydantic request/response contracts
│   │   └── services/
│   │       ├── scraper.py          # Playwright + BeautifulSoup, retry/timeout
│   │       ├── content_processor.py# normalization + signal extraction
│   │       ├── prompts.py          # system + analysis prompt
│   │       ├── ai_analyzer.py      # Gemini primary, Groq fallback
│   │       ├── risk_engine.py      # weighted scoring
│   │       └── orchestrator.py     # pipeline + store
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.tsx                # router
│   │   ├── components/             # RiskGauge, Charts, Layout, ui, AnalysisProgress
│   │   ├── pages/                  # AnalyzePage, ResultsDashboard, ReportsPage, AboutPage
│   │   ├── services/api.ts         # axios client + risk color helpers
│   │   ├── types/index.ts          # mirrors backend schema
│   │   └── styles/index.css        # Tailwind + tokens
│   ├── Dockerfile, nginx.conf, tailwind.config.js, vite.config.ts
├── docker/docker-compose.yml
└── README.md
```

---

## Database decision

**MVP uses an in-memory store; no database yet — and that is a deliberate choice.**

The MVP's job is to prove the scrape → reason → score pipeline. Analysis is stateless per request: nothing in the core flow requires cross-request persistence. Adding a DB now would add infra, migrations, and a connection-pooling failure mode without serving a user need. The store lives behind two functions (`orchestrator.get_analysis` / the `_STORE` dict), so swapping in a real backend is a one-file change.

**When persistence is warranted** (report history, trend analysis, client dashboards), the recommendation is **PostgreSQL on Cloud SQL** for the relational, queryable report records, with the JSON verdict kept in a `JSONB` column:

```sql
CREATE TABLE analyses (
    id            UUID PRIMARY KEY,
    url           TEXT        NOT NULL,
    provider      TEXT        NOT NULL,
    website_type  TEXT        NOT NULL,
    risk_score    SMALLINT    NOT NULL,
    confidence    SMALLINT    NOT NULL,
    risk_level    TEXT        NOT NULL,
    result        JSONB       NOT NULL,   -- full AnalysisResult
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_analyses_created ON analyses (created_at DESC);
CREATE INDEX idx_analyses_url     ON analyses (url);
```

Firestore is a reasonable alternative if the product stays document-shaped and never needs relational queries — but report history and per-client trend charts push toward SQL.

---

## API contracts

### `POST /api/analyze`
Request:
```json
{ "url": "https://example.com" }
```
Response `200`: full `AnalysisResult` (see below). Errors: `422` unsafe/invalid URL, `429` rate limited, `502` all AI providers failed, `500` other.

### `GET /api/analysis/{id}`
Response `200`: the stored `AnalysisResult`. `404` if not found.

### `GET /api/health`
```json
{ "status": "ok", "app": "NarcWatch", "gemini_configured": true, "groq_configured": true }
```

### `AnalysisResult` shape
```json
{
  "id": "uuid",
  "url": "https://...",
  "provider": "gemini",
  "website_type": "Drug Marketplace",
  "purpose": "…",
  "final_risk_score": 85,
  "confidence": 93,
  "risk_level": "Critical Risk",
  "substances_detected": [{ "name": "THC", "mentions": 9 }],
  "suspicious_indicators": ["Crypto-only payment"],
  "risk_indicators": { "drug_references": 6, "commercial_indicators": 7,
                       "shipping_indicators": 3, "payment_indicators": 5,
                       "marketing_indicators": 4 },
  "evidence": [{ "snippet": "THC Gummies 500mg", "category": "drug", "reason": "AI-flagged" }],
  "summary": "…",
  "scrape_meta": { "title": "…", "content_chars": 18240, "...": [] },
  "created_at": "2026-…Z"
}
```

The AI is prompted for the strict JSON schema in the brief (`website_type, purpose, risk_score, confidence, risk_level, substances_detected, suspicious_indicators, evidence, summary`); the backend enriches it with the deterministic `risk_indicators`, substance tallies, categorized evidence, and the blended `final_risk_score`.

---

## Risk engine

The verdict is **80% AI / 20% corroborating signals**. The AI produces a holistic 0–100 `risk_score`; the signal score is a capped, weighted sum of commercial / shipping / payment / marketing indicators (payment and shipping weighted highest — crypto + stealth logistics are the strongest storefront tells). If the AI classifies the site as benign (Educational, Medical, News, Research, Government, Harm Reduction, Blog) with score ≤ 40, the signal contribution is clamped so an ad-heavy news page isn't over-scored. Bands: Safe 0–20, Low 21–40, Moderate 41–60, High 61–80, Critical 81–100.

---

## Security

- **SSRF protection** (`core/security.py`): every URL is scheme-checked (http/https only) and its hostname resolved; if **any** resolved address is private, loopback, link-local, multicast, or reserved, the request is rejected. Cloud metadata hostnames (`metadata.google.internal`) and `localhost` are hard-blocked. This runs **before** the scraper connects.
- **Rate limiting**: SlowAPI, default `10/minute` per client IP on `/analyze`.
- **Request validation**: Pydantic bounds (URL length ≤ 2048, enum-constrained fields, score clamping).
- **Scrape boundaries**: fixed timeout + bounded retries; image/media/font requests aborted; content truncated to `max_content_chars`; `ignore_https_errors` for scraping only, never for internal calls.
- **Security headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`.
- **Container hardening**: backend runs as a non-root user.
- **No secrets in code**: keys via env / Secret Manager.

> Not covered in MVP, flagged for production: authenticated API access, per-account quotas, and outbound egress allow-listing at the network layer.

---

## Running locally

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
cp .env.example .env    # add GEMINI_API_KEY and/or GROQ_API_KEY
uvicorn app.main:app --reload
# → http://localhost:8000/docs
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173  (proxies /api to :8000)
```

**Full stack (Docker)**
```bash
GEMINI_API_KEY=… GROQ_API_KEY=… docker compose -f docker/docker-compose.yml up --build
# frontend → http://localhost:8080
```

Without an API key the pipeline runs up to the AI step and returns a `502` — configure at least one provider.

---

## Development roadmap

**Phase 1 — MVP (done):** URL → scrape → AI verdict → weighted score → dashboard with gauge, 5 charts, evidence. SSRF protection, rate limiting, Gemini↔Groq fallback, Docker.

**Phase 2 — Persistence & history:** Cloud SQL Postgres, real Reports page, shareable report links, CSV/PDF export.

**Phase 3 — Depth:** multi-page crawl (bounded), screenshot capture + vision analysis, WHOIS/registration and hosting signals, per-provider agreement scoring (run both LLMs and compare).

**Phase 4 — Platform:** API keys + accounts, per-client quotas, batch/bulk URL submission, webhook alerts on high-risk hits, scheduled re-scans, audit log.

**Phase 5 — Intelligence:** trend dashboards, cross-site link graphs, model-assisted false-positive review queue.

---

## Future enhancements

- Human-in-the-loop review queue with feedback that tunes the risk weights.
- Confidence-aware routing: escalate low-confidence verdicts to a stronger model.
- Configurable risk policies per client (e.g., a pharmacy compliance team vs. a marketplace trust-and-safety team weight signals differently).
- Structured provenance: link every evidence snippet back to its DOM location.

---

## Boundaries

NarcWatch analyzes only **publicly accessible** content and never facilitates illegal activity. Scores are **probabilistic risk signals** for compliance and triage, **not legal determinations**. Every finding is intended for human review.
