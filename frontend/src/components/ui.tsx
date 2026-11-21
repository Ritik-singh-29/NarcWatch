import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  eyebrow,
  title,
}: {
  children: ReactNode;
  className?: string;
  eyebrow?: string;
  title?: string;
}) {
  return (
    <section className={`glass p-5 ${className}`}>
      {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
      {title && <h3 className="mb-4 font-display text-lg font-semibold text-ink">{title}</h3>}
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: string;
}) {
  return (
    <div className="glass flex flex-col gap-1 p-4">
      <span className="eyebrow">{label}</span>
      <span className="font-mono text-2xl font-bold tabular-nums" style={accent ? { color: accent } : undefined}>
        {value}
      </span>
    </div>
  );
}

export function Badge({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-md px-2.5 py-1 font-mono text-xs"
      style={
        color
          ? { color, backgroundColor: `${color}18`, border: `1px solid ${color}44` }
          : { color: "#8FA0B8", backgroundColor: "#16202F", border: "1px solid #22304A" }
      }
    >
      {children}
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-panel2 ${className}`} />;
}
