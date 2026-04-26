import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Droplets,
  Flower2,
  Sparkles,
  Thermometer,
  Wind,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskScoreBar } from "@/components/RiskScoreBar";
import { TrendBadge } from "@/components/TrendBadge";
import {
  api,
  riskClasses,
  riskKeyFromLabel,
  type AiExplanation,
  type Anomaly,
  type ExplainResponse,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ZipDetail() {
  const { zipcode = "" } = useParams();

  const anomalyQ = useQuery({
    queryKey: ["anomaly", zipcode],
    queryFn: () => api.anomaly(zipcode),
    enabled: !!zipcode,
    retry: 0,
  });
  const contextQ = useQuery({
    queryKey: ["context", zipcode],
    queryFn: () => api.context(zipcode),
    enabled: !!zipcode,
    retry: 0,
  });

  const [explanation, setExplanation] = useState<ExplainResponse | null>(null);
  const explainMutation = useMutation({
    mutationFn: (a: Anomaly) => api.explain(a),
    onSuccess: (res) => setExplanation(res),
  });

  const anomaly = anomalyQ.data;
  const ctx = contextQ.data;
  const key = anomaly ? riskKeyFromLabel(anomaly.label) : "nodata";
  const r = riskClasses(key);

  const fluChart = useMemo(() => {
    if (!ctx?.flu_data?.weekly_data) return [];
    return ctx.flu_data.weekly_data
      .filter((w) => w.ili_percent != null)
      .map((w) => ({ epiweek: String(w.epiweek), ili: w.ili_percent }));
  }, [ctx]);

  return (
    <div className="container max-w-5xl py-8 md:py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-3">
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>

      {(anomalyQ.isError || contextQ.isError) && (
        <Card className="mb-6 border-destructive/40">
          <CardContent className="flex items-start gap-3 py-6">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium">Couldn't load data for ZIP {zipcode}</p>
              <p className="text-xs text-muted-foreground">
                {(anomalyQ.error as Error)?.message ?? (contextQ.error as Error)?.message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk header */}
      <div className={cn("rounded-xl border bg-card p-6", r.border)}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">ZIP code</div>
            <div className="text-3xl font-bold tracking-tight numeric">{zipcode}</div>
          </div>
          {anomaly && (
            <span className={cn("rounded-full border px-3 py-1 text-sm font-medium", r.soft)}>
              {anomaly.label}
            </span>
          )}
        </div>

        {anomalyQ.isLoading && <Skeleton className="mt-6 h-16" />}

        {anomaly && (
          <>
            <div className="mt-6 max-w-md">
              <RiskScoreBar score={anomaly.score} riskKey={key} />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="This week" value={anomaly.observed_this_week} />
              <Stat label="Last week" value={anomaly.observed_last_week} />
              <Stat
                label="% change"
                value={anomaly.percent_change >= 999 ? "+∞%" : `${anomaly.percent_change}%`}
              />
              <Stat label="Z-score" value={anomaly.z_score} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <TrendBadge trend={anomaly.trend} />
              {anomaly.baseline_ili != null && (
                <span>
                  CDC baseline ILI:{" "}
                  <span className="text-foreground numeric">{anomaly.baseline_ili}%</span>
                </span>
              )}
              {anomaly.current_epiweek && (
                <span>
                  Epiweek:{" "}
                  <span className="text-foreground numeric">{anomaly.current_epiweek}</span>
                </span>
              )}
            </div>

            {anomaly.message && (
              <p className="mt-4 text-sm text-muted-foreground">{anomaly.message}</p>
            )}
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Environment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Local environment</CardTitle>
          </CardHeader>
          <CardContent>
            {contextQ.isLoading && <Skeleton className="h-32" />}
            {ctx && (
              <div className="grid grid-cols-2 gap-3">
                <EnvTile
                  icon={<Thermometer className="h-4 w-4" />}
                  label="Temperature"
                  value={ctx.weather.temperature_f != null ? `${ctx.weather.temperature_f}°F` : "—"}
                />
                <EnvTile
                  icon={<Droplets className="h-4 w-4" />}
                  label="Humidity"
                  value={ctx.weather.humidity != null ? `${ctx.weather.humidity}%` : "—"}
                />
                <EnvTile
                  icon={<Wind className="h-4 w-4" />}
                  label="Air quality"
                  value={ctx.weather.air_quality}
                  sub={ctx.weather.us_aqi != null ? `AQI ${ctx.weather.us_aqi}` : undefined}
                />
                <EnvTile
                  icon={<Flower2 className="h-4 w-4" />}
                  label="Pollen"
                  value={ctx.weather.pollen_level}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* CDC FluView */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CDC FluView (3-year ILI %)</CardTitle>
          </CardHeader>
          <CardContent>
            {contextQ.isLoading && <Skeleton className="h-48" />}
            {fluChart.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fluChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="epiweek"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <ReTooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ili"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              !contextQ.isLoading && (
                <p className="text-sm text-muted-foreground">No FluView data available.</p>
              )
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Explanation */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            AI explanation
          </CardTitle>
          <Button
            size="sm"
            disabled={!anomaly || explainMutation.isPending}
            onClick={() => anomaly && explainMutation.mutate(anomaly)}
          >
            {explainMutation.isPending ? "Generating…" : "Generate AI Explanation"}
          </Button>
        </CardHeader>
        <CardContent>
          {explainMutation.isError && (
            <p className="text-sm text-destructive">
              {(explainMutation.error as Error)?.message}
            </p>
          )}
          {!explanation && !explainMutation.isPending && (
            <p className="text-sm text-muted-foreground">
              Click the button to ask the backend AI to explain why this ZIP looks anomalous.
            </p>
          )}
          {explanation && <ExplanationView ai={explanation.ai_explanation} />}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-semibold numeric">{value}</div>
    </div>
  );
}

function EnvTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-base font-semibold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground numeric">{sub}</div>}
    </div>
  );
}

function ExplanationView({ ai }: { ai: AiExplanation }) {
  // Backend returns either:
  //  - openai path: { source: "openai", text: "<string, possibly JSON>" }
  //  - fallback path: { source: "fallback", summary, evidence[], recommendations[] }
  let summary = ai.summary;
  let evidence = ai.evidence;
  let recommendations = ai.recommendations;
  let rawText: string | undefined;

  if (ai.text) {
    const cleaned = ai.text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    try {
      const parsed = JSON.parse(cleaned);
      summary = summary ?? parsed.summary;
      evidence = evidence ?? parsed.evidence;
      recommendations = recommendations ?? parsed.recommendations;
    } catch {
      rawText = ai.text;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {ai.source}
        </span>
        <span className="text-[10px] text-muted-foreground">Not medical advice.</span>
      </div>

      {summary && <p className="text-sm leading-relaxed">{summary}</p>}

      {evidence && evidence.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">Evidence</div>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {evidence.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">Recommendations</div>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {rawText && (
        <pre className="whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-xs">
          {rawText}
        </pre>
      )}
    </div>
  );
}
