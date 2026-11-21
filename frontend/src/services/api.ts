import axios from "axios";
import type { AnalysisResult, AnalysisSummary, RiskLevel } from "../types";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "/api",
  timeout: 90_000,
});

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  const { data } = await client.post<AnalysisResult>("/analyze", { url });
  return data;
}

export async function getAnalysis(id: string): Promise<AnalysisResult> {
  const { data } = await client.get<AnalysisResult>(`/analysis/${id}`);
  return data;
}

export async function listAnalyses(): Promise<AnalysisSummary[]> {
  const { data } = await client.get<AnalysisSummary[]>("/analyses");
  return data;
}

export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (err.code === "ECONNABORTED") return "The analysis timed out. Try a lighter page.";
    return err.message;
  }
  return "Something went wrong. Please try again.";
}

/** Map a risk level to its spectrum color token (hex, for charts + SVG). */
export function riskColor(level: RiskLevel): string {
  switch (level) {
    case "Safe":
      return "#2E9E7A";
    case "Low Risk":
      return "#7BAE4F";
    case "Moderate Risk":
      return "#D9A83C";
    case "High Risk":
      return "#D9722F";
    case "Critical Risk":
      return "#DC5252";
  }
}

export function scoreColor(score: number): string {
  if (score <= 20) return "#2E9E7A";
  if (score <= 40) return "#7BAE4F";
  if (score <= 60) return "#D9A83C";
  if (score <= 80) return "#D9722F";
  return "#DC5252";
}
