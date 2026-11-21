import { Card } from "../components/ui";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1">Documentation</p>
        <h1 className="font-display text-2xl font-semibold">Methodology &amp; limitations</h1>
      </div>

      <Card title="Analytical approach">
        <p className="font-display leading-relaxed text-muted">
          Keyword lists cannot distinguish a harm-reduction guide from a storefront. NarcWatch
          instead evaluates a target the way a trained analyst would: it weighs commercial
          intent, ordering and checkout mechanics, payment instruments, shipping and
          stealth-packaging language, and coded terminology, then judges whether the site is
          selling or promoting controlled substances — or merely discussing them in a medical,
          educational, journalistic, research, or harm-reduction context. Every conclusion is
          tied to verbatim excerpts from the target so reviewers can verify the basis of the
          assessment.
        </p>
      </Card>

      <Card title="Collection and assessment pipeline">
        <ol className="space-y-3 font-display text-sm leading-relaxed text-muted">
          {[
            "URL validation and network safeguards refuse private, loopback, link-local, and cloud-metadata addresses before any connection is made. Only publicly routable targets are collected.",
            "A headless browser renders the target as an ordinary visitor would see it, including JavaScript-rendered content, and structured extraction captures titles, headings, product listings, navigation, and metadata.",
            "Contextual AI analysis classifies the site's type and intent and returns a structured verdict with a risk score, confidence, detected substances, indicators of concern, and supporting excerpts. A secondary engine provides automatic failover.",
            "A weighted scoring engine combines the AI verdict (80%) with corroborating commerce, payment, shipping, and marketing signals (20%), with dampening applied to clearly benign site types to control false positives.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 font-mono text-signal">{String(i + 1).padStart(2, "0")}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="Risk bands">
        <div className="grid gap-2 font-mono text-sm sm:grid-cols-5">
          {[
            { label: "Safe", range: "0–20", color: "#2E9E7A" },
            { label: "Low", range: "21–40", color: "#7BAE4F" },
            { label: "Moderate", range: "41–60", color: "#D9A83C" },
            { label: "High", range: "61–80", color: "#D9722F" },
            { label: "Critical", range: "81–100", color: "#DC5252" },
          ].map((b) => (
            <div
              key={b.label}
              className="rounded-md border px-3 py-2 text-center"
              style={{ borderColor: `${b.color}55`, backgroundColor: `${b.color}12`, color: b.color }}
            >
              <div className="text-xs uppercase tracking-wider">{b.label}</div>
              <div className="mt-0.5 text-sm tabular-nums">{b.range}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Scope and limitations">
        <ul className="space-y-2.5 font-display text-sm leading-relaxed text-muted">
          <li>
            <strong className="text-ink">Public content only.</strong> NarcWatch collects what any
            visitor can see. It does not bypass authentication, access private systems, or collect
            personal data about individuals.
          </li>
          <li>
            <strong className="text-ink">Probabilistic output.</strong> Scores reflect the
            likelihood that content is consistent with illicit controlled-substance commerce. They
            are triage signals, not determinations of fact or law.
          </li>
          <li>
            <strong className="text-ink">Point-in-time.</strong> An assessment reflects the target
            at the moment of collection. Sites change; re-assessment may yield different results.
          </li>
          <li>
            <strong className="text-ink">Human review required.</strong> No assessment should be
            used as the sole basis for enforcement, reporting, or any adverse action. Findings must
            be reviewed and corroborated by qualified personnel under applicable law and agency
            policy.
          </li>
          <li>
            <strong className="text-ink">Known failure modes.</strong> Heavily image-based
            storefronts, gated content, and non-English targets may reduce extraction quality and
            lower confidence. Low-confidence assessments warrant manual inspection.
          </li>
        </ul>
      </Card>

      <Card title="Responsible use">
        <p className="font-display leading-relaxed text-muted">
          NarcWatch is intended for compliance monitoring, trust-and-safety operations, and
          investigative triage by authorized users. It does not facilitate access to illicit
          marketplaces, provide purchasing guidance, or generate content that promotes illegal
          activity. Use of this system must comply with applicable laws, regulations, and the
          operating agency&rsquo;s policies on open-source intelligence collection.
        </p>
      </Card>
    </div>
  );
}
