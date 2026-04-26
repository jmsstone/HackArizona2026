import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Droplets,
  FileText,
  Flower2,
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
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-3 text-muted-foreground">
        <Link to="/dashboard">
          <ArrowLeft className="h-3.5 w-3.5" />
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
      <div className="rounded-md border border-border bg-card">
        <div className="relative p-6">
          <span aria-hidden className={cn("absolute inset-y-6 left-0 w-0.5", r.bg)} />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                ZIP code
              </div>
              <div className="mt-0.5 text-3xl font-semibold tracking-tight numeric">{zipcode}</div>
            </div>
            {anomaly && (
              <div
                className={cn(
                  "text-[11px] uppercase tracking-wider font-medium",
                  r.text,
                )}
              >
                {anomaly.label}
              </div>
            )}
          </div>

          {anomalyQ.isLoading && <Skeleton className="mt-6 h-16" />}

          {anomaly && (
            <div className="mt-6 max-w-md">
              <RiskScoreBar score={anomaly.score} riskKey={key} />
            </div>
          )}
        </div>

        {anomaly && (
          <>
            <div className="grid grid-cols-2 divide-x divide-border border-t border-border sm:grid-cols-4">
              <Stat label="This week" value={anomaly.observed_this_week} />
              <Stat label="Last week" value={anomaly.observed_last_week} />
              <Stat
                label="Change"
                value={anomaly.percent_change >= 999 ? "+∞%" : `${anomaly.percent_change}%`}
              />
              <Stat label="Z-score" value={anomaly.z_score} />
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border px-6 py-4 text-sm text-muted-foreground">
              <TrendBadge trend={anomaly.trend} />
              {anomaly.baseline_ili != null && (
                <span>
                  CDC baseline ILI{" "}
                  <span className="text-foreground numeric">{anomaly.baseline_ili}%</span>
                </span>
              )}
              {anomaly.current_epiweek && (
                <span>
                  Epiweek <span className="text-foreground numeric">{anomaly.current_epiweek}</span>
                </span>
              )}
            </div>

            {anomaly.message && (
              <p className="border-t border-border px-6 py-4 text-sm text-muted-foreground">
                {anomaly.message}
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Environment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Local environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contextQ.isLoading && <Skeleton className="h-32" />}
            {ctx && (
              <div className="grid grid-cols-2 divide-x divide-y divide-border border border-border">
                <EnvTile
                  icon={<Thermometer className="h-3.5 w-3.5" />}
                  label="Temperature"
                  value={ctx.weather.temperature_f != null ? `${ctx.weather.temperature_f}°F` : "—"}
                />
                <EnvTile
                  icon={<Droplets className="h-3.5 w-3.5" />}
                  label="Humidity"
                  value={ctx.weather.humidity != null ? `${ctx.weather.humidity}%` : "—"}
                />
                <EnvTile
                  icon={<Wind className="h-3.5 w-3.5" />}
                  label="Air quality"
                  value={ctx.weather.air_quality}
                  sub={ctx.weather.us_aqi != null ? `AQI ${ctx.weather.us_aqi}` : undefined}
                />
                <EnvTile
                  icon={<Flower2 className="h-3.5 w-3.5" />}
                  label="Pollen"
                  value={ctx.weather.pollen_level}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* CDC FluView */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              CDC FluView · 3-year ILI %
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contextQ.isLoading && <Skeleton className="h-48" />}
            {fluChart.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fluChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" />
                    <XAxis
                      dataKey="epiweek"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      interval="preserveStartEnd"
                      stroke="hsl(var(--border))"
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      stroke="hsl(var(--border))"
                    />
                    <ReTooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ili"
                      stroke="hsl(var(--foreground))"
                      strokeWidth={1.5}
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            AI Explanation
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            disabled={!anomaly || explainMutation.isPending}
            onClick={() => anomaly && explainMutation.mutate(anomaly)}
          >
            {explainMutation.isPending ? "Generating…" : "Generate"}
          </Button>
        </CardHeader>
        <CardContent>
          {explainMutation.isError && (
            <p className="text-sm text-destructive">{(explainMutation.error as Error)?.message}</p>
          )}
          {!explanation && !explainMutation.isPending && (
            <p className="text-sm text-muted-foreground">
              Generate a written summary of why this ZIP code's signal looks anomalous.
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
    <div className="px-6 py-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold numeric">{value}</div>
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
    <div className="px-4 py-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground numeric">{sub}</div>}
    </div>
  );
}

function ExplanationView({ ai }: { ai: AiExplanation }) {
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
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Source: {ai.source}</span>
        <span aria-hidden>·</span>
        <span>Not medical advice</span>
      </div>

      {summary && <p className="text-sm leading-relaxed">{summary}</p>}

      {evidence && evidence.length > 0 && (
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            Evidence
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm marker:text-muted-foreground">
            {evidence.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            Recommendations
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm marker:text-muted-foreground">
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {rawText && (
        <pre className="whitespace-pre-wrap rounded-sm border border-border bg-muted/30 p-3 text-xs">
          {rawText}
        </pre>
      )}
    </div>
  );
}
