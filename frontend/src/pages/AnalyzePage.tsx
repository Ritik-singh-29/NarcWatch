import { useState } from "react";
import { analyzeUrl, apiErrorMessage } from "../services/api";
import AnalysisProgress from "../components/AnalysisProgress";
import ResultsDashboard from "./ResultsDashboard";
import type { AnalysisResult } from "../types";

function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export default function AnalyzePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  async function handleSubmit() {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setError("Enter a target URL to assess.");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await analyzeUrl(normalized);
      setResult(res);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-6">
        <button
          className="btn-ghost"
          onClick={() => {
            setResult(null);
            setUrl("");
          }}
        >
          &larr; New assessment
        </button>
        <ResultsDashboard result={result} />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero — capability statement */}
      <section className="relative overflow-hidden rounded-xl border border-line/70 bg-panel/40 px-6 py-14">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid [background-size:36px_36px] opacity-30" />
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow mb-4">Open-web assessment</p>
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-[2.6rem] sm:leading-[1.15]">
            Contextual risk assessment of websites suspected of{" "}
            <span className="text-signal">controlled-substance commerce</span>.
          </h1>
          <p className="mt-4 max-w-2xl font-display text-[15px] leading-relaxed text-muted">
            Submit a publicly accessible URL. NarcWatch extracts the site&rsquo;s visible content
            and applies contextual AI analysis to distinguish illicit sale or promotion from
            legitimate medical, pharmaceutical, educational, and harm-reduction activity —
            returning a scored, evidence-linked assessment for triage.
          </p>

          {/* Search bar */}
          <div className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-md border border-line bg-base/70 px-4 focus-within:border-signal/60">
              <span className="font-mono text-sm text-muted">https://</span>
              <input
                value={url.replace(/^https?:\/\//i, "")}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="target-domain.com"
                aria-label="Target website URL"
                className="w-full bg-transparent py-3.5 font-mono text-sm text-ink outline-none placeholder:text-muted/50"
              />
            </div>
            <button className="btn-signal justify-center" onClick={handleSubmit} disabled={loading}>
              Run assessment
            </button>
          </div>
          <p className="mt-3 font-mono text-[11px] text-muted/70">
            Public content only · No authentication bypass · Private and internal addresses are refused
          </p>
          {error && (
            <p role="alert" className="mt-4 max-w-2xl rounded-md border border-crit/40 bg-crit/10 px-4 py-2 font-mono text-sm text-crit">
              {error}
            </p>
          )}
        </div>
      </section>

      {loading && <AnalysisProgress url={normalizeUrl(url)} />}

      {/* Method summary */}
      {!loading && (
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            {
              t: "Collection",
              d: "A headless browser renders the target as a visitor would see it and extracts titles, headings, product listings, navigation, and metadata.",
            },
            {
              t: "Analysis",
              d: "Contextual AI evaluates intent — commercial, medical, educational, research — rather than matching keywords, and cites the passages behind its judgment.",
            },
            {
              t: "Assessment",
              d: "A weighted engine combines the AI verdict with commerce, payment, and shipping signals into a 0–100 risk score with confidence and evidence.",
            },
          ].map((s) => (
            <div key={s.t} className="glass p-5">
              <div className="case-rule">
                <h3 className="font-mono text-[13px] font-semibold uppercase tracking-wider text-ink">{s.t}</h3>
              </div>
              <p className="font-display text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
