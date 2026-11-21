import { useEffect, useState } from "react";
import { scoreColor } from "../services/api";

interface Props {
  score: number; // 0-100
  level: string;
  size?: number;
}

/**
 * The signature element: a 270° radial gauge that fills to the risk score in
 * the verdict's own spectrum color, with a monospace score at the core.
 */
export default function RiskGauge({ score, level, size = 220 }: Props) {
  const [animated, setAnimated] = useState(0);
  const color = scoreColor(score);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(score));
    return () => cancelAnimationFrame(id);
  }, [score]);

  const stroke = 14;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const arc = 270; // degrees of sweep
  const circumference = 2 * Math.PI * r;
  const arcLength = (arc / 360) * circumference;
  const filled = (animated / 100) * arcLength;
  const rotate = 135; // start bottom-left, sweep clockwise

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-0">
        <g transform={`rotate(${rotate} ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#22304A"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            style={{ transition: "stroke-dasharray 1.1s cubic-bezier(0.22,1,0.36,1)", filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        </g>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-5xl font-bold tabular-nums" style={{ color }}>
          {Math.round(animated)}
        </span>
        <span className="font-mono text-[11px] text-muted">/ 100</span>
        <span
          className="mt-2 rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider"
          style={{ color, backgroundColor: `${color}1A`, border: `1px solid ${color}55` }}
        >
          {level}
        </span>
      </div>
    </div>
  );
}
