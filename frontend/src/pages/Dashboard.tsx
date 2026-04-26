import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw } from "lucide-react";

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
      <div className="mb-8 flex items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Anomaly Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ZIP codes ranked by anomaly score, highest first.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 border border-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-none" />
          ))}
        </div>
      )}

      {isError && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-start gap-3 py-6">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div className="space-y-1">
              <p className="font-medium">Couldn't reach the Epicenter backend</p>
              <p className="text-sm text-muted-foreground">
                Make sure the Flask server is running and that the anomaly blueprint is registered
                in <code>app.py</code>.
              </p>
              <p className="text-xs text-muted-foreground">{(error as Error)?.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {data && data.count === 0 && (
        <div className="rounded-md border border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">No reports yet.</p>
        </div>
      )}

      {data && data.count > 0 && (
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 border border-border rounded-md overflow-hidden">
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
      className="group relative block bg-card p-5 transition-colors hover:bg-muted/40"
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-3 left-0 w-0.5", r.bg)}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">ZIP</div>
          <div className="mt-0.5 text-2xl font-semibold tracking-tight numeric">
            {anomaly.zip_code}
          </div>
        </div>
        <div className={cn("text-[11px] uppercase tracking-wider font-medium", r.text)}>
          {anomaly.label}
        </div>
      </div>

      <div className="mt-5">
        <RiskScoreBar score={anomaly.score} riskKey={key} />
      </div>

      <div className="mt-5 flex items-baseline gap-6 border-t border-border pt-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            This week
          </div>
          <div className="mt-0.5 text-base font-semibold numeric">{anomaly.observed_this_week}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Last week
          </div>
          <div className="mt-0.5 text-base font-semibold numeric">{anomaly.observed_last_week}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Change</div>
          <div
            className={cn(
              "mt-0.5 text-base font-semibold numeric",
              pct > 0 ? r.text : "text-muted-foreground",
            )}
          >
            {pctLabel}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <TrendBadge trend={anomaly.trend} />
      </div>
    </Link>
  );
}
