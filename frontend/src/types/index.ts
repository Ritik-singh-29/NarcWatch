export type RiskLevel =
  | "Safe"
  | "Low Risk"
  | "Moderate Risk"
  | "High Risk"
  | "Critical Risk";

export interface SubstanceMention {
  name: string;
  mentions: number;
}

export interface RiskIndicators {
  drug_references: number;
  commercial_indicators: number;
  shipping_indicators: number;
  payment_indicators: number;
  marketing_indicators: number;
}

export interface Evidence {
  snippet: string;
  category: string;
  reason: string;
}

export interface ScrapeMeta {
  title: string | null;
  meta_description: string | null;
  headings: string[];
  nav_items: string[];
  internal_links: string[];
  product_names: string[];
  content_chars: number;
}

export interface AnalysisResult {
  id: string;
  url: string;
  provider: string;
  website_type: string;
  purpose: string;
  final_risk_score: number;
  confidence: number;
  risk_level: RiskLevel;
  substances_detected: SubstanceMention[];
  suspicious_indicators: string[];
  risk_indicators: RiskIndicators;
  evidence: Evidence[];
  summary: string;
  scrape_meta: ScrapeMeta;
  created_at: string;
}

export interface AnalysisSummary {
  id: string;
  url: string;
  provider: string;
  website_type: string;
  risk_score: number;
  confidence: number;
  risk_level: RiskLevel;
  created_at: string;
}
