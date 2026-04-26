import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, MapPin, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendBadge } from "@/components/TrendBadge";
import { RiskScoreBar } from "@/components/RiskScoreBar";
import { api, riskClasses, riskKeyFromLabel, type Anomaly } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["anomalies"],
    queryFn: api.anomalies,
    retry: 0,
  });

  return (
    <div className="container py-8 md:py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Anomaly Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ZIP codes with the highest anomaly scores appear first.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-start gap-3 py-6">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div className="space-y-1">
              <p className="font-medium">Couldn't reach the FluWatch backend</p>
              <p className="text-sm text-muted-foreground">
                Make sure the Flask server is running at <code>http://localhost:5000</code> and that
                the anomaly blueprint is registered in <code>app.py</code>.
              </p>
              <p className="text-xs text-muted-foreground">{(error as Error)?.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {data && data.count === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No reports yet — be the first to report.</p>
          </CardContent>
        </Card>
      )}

      {data && data.count > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.anomalies.map((a) => (
            <AnomalyCard key={a.zip_code} anomaly={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const key = riskKeyFromLabel(anomaly.label);
  const r = riskClasses(key);
  const pct = anomaly.percent_change;
  const pctLabel = pct >= 999 ? "+∞%" : `${pct >= 0 ? "+" : ""}${pct}%`;

  return (
    <Link
      to={`/zip/${encodeURIComponent(anomaly.zip_code)}`}
      className={cn(
        "group relative block rounded-lg border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg",
        r.border,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            ZIP
          </div>
          <div className="mt-0.5 text-2xl font-bold tracking-tight numeric">{anomaly.zip_code}</div>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs font-medium",
            r.soft,
          )}
        >
          {anomaly.label}
        </span>
      </div>

      <div className="mt-4">
        <RiskScoreBar score={anomaly.score} riskKey={key} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">This week</div>
          <div className="mt-0.5 text-lg font-semibold numeric">{anomaly.observed_this_week}</div>
        </div>
        <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Last week</div>
          <div className="mt-0.5 text-lg font-semibold numeric">{anomaly.observed_last_week}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <TrendBadge trend={anomaly.trend} />
        <span className={cn("text-sm font-medium numeric", pct > 0 ? r.text : "text-muted-foreground")}>
          {pctLabel}
        </span>
      </div>
    </Link>
  );
}
