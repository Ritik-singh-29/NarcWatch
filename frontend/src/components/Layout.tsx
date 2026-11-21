import { NavLink, Outlet } from "react-router-dom";

const nav = [
  { to: "/", label: "Assessment", end: true },
  { to: "/reports", label: "Case History" },
  { to: "/about", label: "Methodology" },
];

export default function Layout() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Authorized-use strip — persistent, like internal-use banners on intel tooling */}
      <div className="border-b border-signal/30 bg-signal/10">
        <p className="mx-auto max-w-6xl px-5 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-signal">
          Controlled-substance web intelligence · For authorized compliance &amp; investigative use
        </p>
      </div>

      <header className="sticky top-0 z-40 border-b border-line/70 bg-base/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <NavLink to="/" className="flex items-center gap-3">
            {/* Shield mark */}
            <svg width="26" height="30" viewBox="0 0 26 30" aria-hidden="true">
              <path
                d="M13 1 L24 5 V14 C24 21.5 19.5 26.8 13 29 C6.5 26.8 2 21.5 2 14 V5 Z"
                fill="none"
                stroke="#C7A54A"
                strokeWidth="1.6"
              />
              <circle cx="13" cy="13" r="3.4" fill="#C7A54A" />
              <line x1="13" y1="18.5" x2="13" y2="23" stroke="#C7A54A" strokeWidth="1.6" />
            </svg>
            <span className="flex flex-col leading-none">
              <span className="font-mono text-base font-semibold tracking-tight">
                <span className="text-ink">NARC</span><span className="text-signal">WATCH</span>
              </span>
              <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
                Web intelligence unit
              </span>
            </span>
          </NavLink>
          <nav className="flex items-center gap-1">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 font-mono text-[13px] transition ${
                    isActive ? "bg-panel2 text-signal" : "text-muted hover:text-ink"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-line/70 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5">
          <p className="font-mono text-xs text-muted">
            NarcWatch assesses publicly accessible web content only. Outputs are probabilistic
            risk indicators for triage and compliance monitoring.
          </p>
          <p className="font-mono text-[11px] leading-relaxed text-muted/70">
            Assessments do not constitute a legal determination, evidence of criminal activity,
            or grounds for enforcement action on their own. All findings require review and
            corroboration by qualified personnel in accordance with applicable law and agency policy.
          </p>
        </div>
      </footer>
    </div>
  );
}
