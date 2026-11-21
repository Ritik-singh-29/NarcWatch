import { useEffect, useState } from "react";

const STAGES = [
  "Validating target URL",
  "Rendering target site",
  "Extracting content",
  "Normalizing content",
  "Contextual AI analysis",
  "Computing risk assessment",
];

/**
 * Since the backend returns a single response, we advance stages on a timed
 * heuristic to communicate progress. The final stage holds until the promise
 * resolves.
 */
export default function AnalysisProgress({ url }: { url: string }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timings = [400, 1600, 900, 600, 4000, 1200];
    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      idx = Math.min(idx + 1, STAGES.length - 1);
      setActive(idx);
      if (idx < STAGES.length - 1) timer = setTimeout(tick, timings[idx]);
    };
    timer = setTimeout(tick, timings[0]);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="glass mx-auto max-w-lg p-6">
      <p className="eyebrow mb-1">Assessment in progress</p>
      <p className="mb-5 truncate font-mono text-sm text-ink">{url}</p>
      <ol className="space-y-3">
        {STAGES.map((stage, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <li key={stage} className="flex items-center gap-3">
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border font-mono text-[11px] ${
                  done
                    ? "border-safe/50 bg-safe/15 text-safe"
                    : current
                      ? "border-signal/60 bg-signal/15 text-signal"
                      : "border-line text-muted"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={`font-mono text-sm ${current ? "text-ink" : done ? "text-muted" : "text-muted/60"}`}>
                {stage}
                {current && <span className="ml-1 animate-pulse text-signal">…</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
