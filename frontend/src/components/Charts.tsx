import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalysisResult } from "../types";
import { scoreColor } from "../services/api";

const AXIS = "#8FA0B8";
const GRID = "#22304A";

const tooltipStyle = {
  background: "#101827",
  border: "1px solid #22304A",
  borderRadius: 8,
  fontFamily: "IBM Plex Mono, monospace",
  fontSize: 12,
  color: "#E8EDF5",
};

/** 1. Substance Mention Frequency */
export function SubstanceFrequencyChart({ data }: { data: AnalysisResult["substances_detected"] }) {
  if (!data.length) return <Empty label="No substances detected" />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 12, right: 12 }}>
        <XAxis type="number" stroke={AXIS} tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" stroke={AXIS} tick={{ fontSize: 11 }} width={110} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#1A2331" }} />
        <Bar dataKey="mentions" radius={[0, 4, 4, 0]} fill="#C7A54A" />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 2. Risk Factor Breakdown (radar over indicator categories) */
export function RiskFactorRadar({ result }: { result: AnalysisResult }) {
  const i = result.risk_indicators;
  const data = [
    { factor: "Drug", value: i.drug_references },
    { factor: "Commercial", value: i.commercial_indicators },
    { factor: "Shipping", value: i.shipping_indicators },
    { factor: "Payment", value: i.payment_indicators },
    { factor: "Marketing", value: i.marketing_indicators },
  ];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke={GRID} />
        <PolarAngleAxis dataKey="factor" tick={{ fill: AXIS, fontSize: 11 }} />
        <PolarRadiusAxis tick={{ fill: AXIS, fontSize: 9 }} stroke={GRID} />
        <Radar dataKey="value" stroke="#C7A54A" fill="#C7A54A" fillOpacity={0.35} />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/** 3. Confidence Visualization (radial) */
export function ConfidenceRadial({ confidence }: { confidence: number }) {
  const data = [{ name: "confidence", value: confidence, fill: "#C7A54A" }];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadialBarChart data={data} innerRadius="72%" outerRadius="96%" startAngle={90} endAngle={-270}>
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar background={{ fill: "#22304A" }} dataKey="value" cornerRadius={12} angleAxisId={0} />
        <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fill="#E8EDF5" fontSize={34} fontWeight={700} fontFamily="IBM Plex Mono">
          {confidence}%
        </text>
        <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fill="#8FA0B8" fontSize={11} fontFamily="IBM Plex Mono">
          confidence
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

/** 4. Risk Category Distribution (contribution of each indicator to concern) */
export function RiskCategoryChart({ result }: { result: AnalysisResult }) {
  const i = result.risk_indicators;
  const data = [
    { name: "Drug", value: i.drug_references, color: "#DC5252" },
    { name: "Payment", value: i.payment_indicators, color: "#D9722F" },
    { name: "Shipping", value: i.shipping_indicators, color: "#D9A83C" },
    { name: "Marketing", value: i.marketing_indicators, color: "#7BAE4F" },
    { name: "Commercial", value: i.commercial_indicators, color: "#2E9E7A" },
  ];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ left: 0, right: 8 }}>
        <XAxis dataKey="name" stroke={AXIS} tick={{ fontSize: 11 }} />
        <YAxis stroke={AXIS} tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#1A2331" }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 5. AI Assessment Summary strip (score vs confidence) */
export function AssessmentSummaryChart({ result }: { result: AnalysisResult }) {
  const data = [
    { name: "Risk", value: result.final_risk_score, color: scoreColor(result.final_risk_score) },
    { name: "Confidence", value: result.confidence, color: "#C7A54A" },
  ];
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" domain={[0, 100]} stroke={AXIS} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" stroke={AXIS} tick={{ fontSize: 12 }} width={90} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#1A2331" }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed border-line">
      <span className="font-mono text-sm text-muted">{label}</span>
    </div>
  );
}
