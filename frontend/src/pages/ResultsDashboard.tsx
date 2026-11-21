import RiskGauge from "../components/RiskGauge";
import { Badge, Card, StatTile } from "../components/ui";
import {
  AssessmentSummaryChart,
  ConfidenceRadial,
  RiskCategoryChart,
  RiskFactorRadar,
  SubstanceFrequencyChart,
} from "../components/Charts";
import { riskColor } from "../services/api";
import type { AnalysisResult } from "../types";

const CATEGORY_COLOR: Record<string, string> = {
  drug: "#DC5252",
  payment: "#D9722F",
  shipping: "#D9A83C",
  marketing: "#7BAE4F",
  commercial: "#2E9E7A",
  other: "#8FA0B8",
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default function ResultsDashboard({ result }: { result: AnalysisResult }) {
  const color = riskColor(result.risk_level);
  const i = result.risk_indicators;
  const caseRef = result.id.slice(0, 8).toUpperCase();

  const indicatorCards = [
    { label: "Drug references", value: i.drug_references },
    { label: "Commercial", value: i.commercial_indicators },
    { label: "Shipping", value: i.shipping_indicators },
    { label: "Payment", value: i.payment_indicators },
    { label: "Marketing", value: i.marketing_indicators },
  ];

  return (
    <div className="space-y-6">
      {/* Case-file header */}
      <div className="glass overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 bg-panel2/60 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Assessment</span>
            <span className="font-mono text-sm font-semibold text-signal">#{caseRef}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge color={color}>{result.risk_level}</Badge>
            <Badge>{result.website_type}</Badge>
            <span className="font-mono text-[11px] text-muted">
              {formatTimestamp(result.created_at)} · engine: {result.provider}
            </span>
          </div>
        </div>
        <div className="px-5 py-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">Target</span>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="ml-3 break-all font-mono text-sm text-steel underline-offset-4 hover:text-signal hover:underline"
          >
            {result.url}
          </a>
        </div>
      </div>

      {/* Verdict band: gauge + summary */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="flex flex-col items-center justify-center" eyebrow="Overall risk score">
          <RiskGauge score={result.final_risk_score} level={result.risk_level} />
        </Card>

        <Card eyebrow="Analyst summary" title={result.website_type}>
          <p className="font-display text-sm text-muted">{result.purpose}</p>
          <p className="mt-3 font-display leading-relaxed text-ink">{result.summary}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile label="Confidence" value={`${result.confidence}%`} accent="#C7A54A" />
            <StatTile label="Risk score" value={result.final_risk_score} accent={color} />
            <StatTile label="Content reviewed" value={`${result.scrape_meta.content_chars.toLocaleString()} ch`} />
          </div>
        </Card>
      </div>

      {/* Indicator counts */}
      <div>
        <div className="case-rule">
          <h2 className="font-mono text-[13px] font-semibold uppercase tracking-wider">Indicator counts</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {indicatorCards.map((c) => (
            <StatTile key={c.label} label={c.label} value={c.value} />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div>
        <div className="case-rule">
          <h2 className="font-mono text-[13px] font-semibold uppercase tracking-wider">Analytical views</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Risk factor breakdown">
            <RiskFactorRadar result={result} />
          </Card>
          <Card title="Risk category distribution">
            <RiskCategoryChart result={result} />
          </Card>
          <Card title="Substance mention frequency">
            <SubstanceFrequencyChart data={result.substances_detected} />
          </Card>
          <Card title="Assessment confidence">
            <ConfidenceRadial confidence={result.confidence} />
          </Card>
        </div>
        <div className="mt-6">
          <Card title="Score summary">
            <AssessmentSummaryChart result={result} />
          </Card>
        </div>
      </div>

      {/* Findings */}
      <div>
        <div className="case-rule">
          <h2 className="font-mono text-[13px] font-semibold uppercase tracking-wider">Findings</h2>
        </div>
        <div className="space-y-6">
          {result.suspicious_indicators.length > 0 && (
            <Card title="Indicators of concern">
              <div className="flex flex-wrap gap-2">
                {result.suspicious_indicators.map((s, idx) => (
                  <Badge key={idx} color="#D9722F">
                    {s}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          <Card title="Supporting excerpts">
            <p className="mb-3 font-mono text-[11px] text-muted">
              Verbatim passages extracted from the target&rsquo;s public content, categorized by signal type.
            </p>
            {result.evidence.length === 0 ? (
              <p className="font-mono text-sm text-muted">No specific excerpts were flagged for this target.</p>
            ) : (
              <ul className="space-y-2">
                {result.evidence.map((e, idx) => {
                  const c = CATEGORY_COLOR[e.category] ?? CATEGORY_COLOR.other;
                  return (
                    <li key={idx} className="flex items-start gap-3 rounded-md border border-line bg-base/40 p-3">
                      <span
                        className="mt-0.5 shrink-0 rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                        style={{ color: c, backgroundColor: `${c}18`, border: `1px solid ${c}44` }}
                      >
                        {e.category}
                      </span>
                      <span className="font-mono text-sm text-ink">&ldquo;{e.snippet}&rdquo;</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Per-report limitation note */}
      <p className="rounded-md border border-line/70 bg-panel/50 px-4 py-3 font-mono text-[11px] leading-relaxed text-muted">
        This assessment is a probabilistic indicator derived from publicly accessible content at the
        time of collection. It is not a legal determination and must be reviewed and corroborated by
        qualified personnel before any action is taken.
      </p>
    </div>
  );
}
