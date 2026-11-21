"""SQLite persistence for analysis results.

The full AnalysisResult is stored as JSON in the `result` column; summary fields
(url, scores, level, type) are also stored as indexed columns so the list view
can be rendered without deserializing every row.

This module is the single seam behind which storage lives. Swapping SQLite for
Cloud SQL Postgres later means reimplementing these four functions; nothing else
in the app changes. See README "Database decision".
"""
import json
import sqlite3
import threading
from pathlib import Path
from typing import List, Optional

from app.schemas.analysis import AnalysisResult

# DB file lives next to the app package (alongside the code, git-ignored).
_DB_PATH = Path(__file__).resolve().parents[2] / "narcwatch.db"
_lock = threading.Lock()


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create the table if it doesn't exist. Called once at app startup."""
    with _lock, _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS analyses (
                id            TEXT PRIMARY KEY,
                url           TEXT    NOT NULL,
                provider      TEXT    NOT NULL,
                website_type  TEXT    NOT NULL,
                risk_score    INTEGER NOT NULL,
                confidence    INTEGER NOT NULL,
                risk_level    TEXT    NOT NULL,
                result        TEXT    NOT NULL,
                created_at    TEXT    NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_created ON analyses (created_at DESC)")


def save(result: AnalysisResult) -> None:
    with _lock, _connect() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO analyses
              (id, url, provider, website_type, risk_score, confidence, risk_level, result, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                result.id,
                result.url,
                result.provider,
                result.website_type,
                result.final_risk_score,
                result.confidence,
                result.risk_level.value,
                result.model_dump_json(),
                result.created_at,
            ),
        )


def get(analysis_id: str) -> Optional[AnalysisResult]:
    with _lock, _connect() as conn:
        row = conn.execute(
            "SELECT result FROM analyses WHERE id = ?", (analysis_id,)
        ).fetchone()
    if not row:
        return None
    return AnalysisResult.model_validate(json.loads(row["result"]))


def list_recent(limit: int = 50) -> List[dict]:
    """Return lightweight summaries for the Reports list, newest first."""
    with _lock, _connect() as conn:
        rows = conn.execute(
            """
            SELECT id, url, provider, website_type, risk_score, confidence, risk_level, created_at
            FROM analyses
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [dict(row) for row in rows]


# Guarantee the schema exists as soon as this module is imported, so saves never
# hit a missing table even if the startup hook is bypassed (e.g. under tests).
init_db()
