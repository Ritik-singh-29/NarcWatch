import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiErrorMessage, getAnalysis, listAnalyses, riskColor } from "../services/api";
import { Badge, Card, Skeleton } from "../components/ui";
import ResultsDashboard from "./ResultsDashboard";
import type { AnalysisResult, AnalysisSummary } from "../types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReportsPage() {
  const [rows, setRows] = useState<AnalysisSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AnalysisResult | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    listAnalyses()
      .then(setRows)
      .catch((e) => setError(apiErrorMessage(e)));
  }, []);

  async function openReport(id: string) {
    setLoadingReport(true);
    setError(null);
    try {
      setSelected(await getAnalysis(id));
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoadingReport(false);
    }
  }

  if (selected) {
    return (
      <div className="space-y-6">
        <button className="btn-ghost" onClick={() => setSelected(null)}>
          &larr; Back to case history
        </button>
        <ResultsDashboard result={selected} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1">Records</p>
        <h1 className="font-display text-2xl font-semibold">Case history</h1>
        <p className="mt-1 font-display text-sm text-muted">
          All completed assessments are retained here. Select a record to reopen the full case file.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-crit/40 bg-crit/10 px-4 py-2 font-mono text-sm text-crit">
          {error}
        </p>
      )}

      {loadingReport && <p className="font-mono text-sm text-muted">Retrieving case file&hellip;</p>}

      {rows === null && !error && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {rows?.length === 0 && (
        <Card>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-line bg-panel2">
              <span className="font-mono text-lg text-muted">&empty;</span>
            </span>
            <h2 className="font-display text-lg font-semibold">No assessments on record</h2>
            <p className="max-w-sm font-display text-sm text-muted">
              Completed assessments are stored here for later review and comparison.
            </p>
            <Link to="/" className="btn-signal mt-2">
              Analyze a website
            </Link>
          </div>
        </Card>
      )}

      {rows && rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((r) => {
            const color = riskColor(r.risk_level);
            return (
              <li key={r.id}>
                <button
                  onClick={() => openReport(r.id)}
                  className="glass flex w-full items-center gap-4 p-4 text-left transition hover:border-signal/50"
                >
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-lg font-mono text-lg font-bold tabular-nums"
                    style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}44` }}
                  >
                    {r.risk_score}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm text-ink">{r.url}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge color={color}>{r.risk_level}</Badge>
                      <Badge>{r.website_type}</Badge>
                      <span className="font-mono text-xs text-muted">{formatDate(r.created_at)}</span>
                    </div>
                  </div>
                  <span className="font-mono text-muted">&rarr;</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
