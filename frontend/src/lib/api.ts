// Epicenter API client — talks to the Flask backend on localhost:5000.
// All endpoints are typed against the actual response shapes returned by the Python services.

export const API_BASE = "http://localhost:5001/api";

export type AnomalyLabel =
  | "Normal"
  | "Emerging Anomaly"
  | "Significant Anomaly"
  | "Possible Outbreak"
  | "No Data";

export type TrendDirection =
  | "stable"
  | "increasing"
  | "accelerating"
  | "declining"
  | "no data";

export interface Anomaly {
  zip_code: string;
  score: number;
  label: AnomalyLabel | string;
  label_color?: string;
  observed_this_week: number;
  observed_last_week: number;
  baseline_ili: number | null;
  baseline_weeks_found?: number;
  percent_change: number;
  z_score: number;
  trend: TrendDirection | string;
  current_epiweek?: number;
  total_reports_all_time?: number;
  message?: string;
}

export interface AnomaliesResponse {
  count: number;
  anomalies: Anomaly[];
}

export interface FluViewWeek {
  epiweek: number;
  ili_percent: number | null;
  num_patients?: number | null;
  num_providers?: number | null;
}

export interface ContextResponse {
  zip_code: string;
  flu_data: {
    source: string;
    range: string;
    weekly_data: FluViewWeek[];
  };
  weather: {
    source: string;
    temperature_f: number | null;
    humidity: number | null;
    air_quality: string;
    pollen_level: string;
    us_aqi?: number;
    pm2_5?: number;
  };
  environment_notes: string[];
}

export interface AiExplanation {
  source: "openai" | "fallback" | string;
  text?: string;
  summary?: string;
  evidence?: string[];
  recommendations?: string[];
}

export interface ExplainResponse {
  anomaly_data: Anomaly;
  context_data: ContextResponse;
  ai_explanation: AiExplanation;
}

export interface ReportInput {
  professional_diagnosis_of_influenza: boolean;
  zipcode: string;
  state: string;
  severity_of_symptoms:
    | "Asymptomatic"
    | "Mild"
    | "Moderate"
    | "Severe"
    | "Critical";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error ?? body?.details ?? JSON.stringify(body);
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(`${res.status} ${res.statusText}${detail ? ` — ${detail}` : ""}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string; timestamp: string }>("/health"),
  anomalies: () => request<AnomaliesResponse>("/anomalies"),
  anomaly: (zip: string) => request<Anomaly>(`/anomalies/${encodeURIComponent(zip)}`),
  context: (zip: string) => request<ContextResponse>(`/context/${encodeURIComponent(zip)}`),
  explain: (anomaly: Anomaly) =>
    request<ExplainResponse>("/context/explain", {
      method: "POST",
      body: JSON.stringify({ anomaly_data: anomaly }),
    }),
  submitReport: (input: ReportInput) =>
    request<{ status: string; message: string; data: unknown }>("/reports", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

// Helpers ---------------------------------------------------------------

export type RiskKey = "normal" | "emerging" | "significant" | "outbreak" | "nodata";

export function riskKeyFromLabel(label: string): RiskKey {
  const l = label.toLowerCase();
  if (l.includes("outbreak")) return "outbreak";
  if (l.includes("significant")) return "significant";
  if (l.includes("emerging")) return "emerging";
  if (l.includes("no data")) return "nodata";
  return "normal";
}

export function riskClasses(key: RiskKey) {
  // Tailwind doesn't pick up dynamic class names, so map explicitly.
  switch (key) {
    case "outbreak":
      return {
        bg: "bg-risk-outbreak",
        text: "text-risk-outbreak",
        border: "border-risk-outbreak",
        ring: "ring-risk-outbreak/40",
        soft: "bg-risk-outbreak/15 text-risk-outbreak border-risk-outbreak/30",
      };
    case "significant":
      return {
        bg: "bg-risk-significant",
        text: "text-risk-significant",
        border: "border-risk-significant",
        ring: "ring-risk-significant/40",
        soft: "bg-risk-significant/15 text-risk-significant border-risk-significant/30",
      };
    case "emerging":
      return {
        bg: "bg-risk-emerging",
        text: "text-risk-emerging",
        border: "border-risk-emerging",
        ring: "ring-risk-emerging/40",
        soft: "bg-risk-emerging/15 text-risk-emerging border-risk-emerging/30",
      };
    case "nodata":
      return {
        bg: "bg-risk-nodata",
        text: "text-risk-nodata",
        border: "border-risk-nodata",
        ring: "ring-risk-nodata/40",
        soft: "bg-muted text-muted-foreground border-border",
      };
    default:
      return {
        bg: "bg-risk-normal",
        text: "text-risk-normal",
        border: "border-risk-normal",
        ring: "ring-risk-normal/40",
        soft: "bg-risk-normal/15 text-risk-normal border-risk-normal/30",
      };
  }
}
