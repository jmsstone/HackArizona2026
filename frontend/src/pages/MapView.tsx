import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnomalyMap } from "@/components/AnomalyMap";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function MapView() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["anomalies"],
    queryFn: api.anomalies,
    retry: 0,
  });

  return (
    <div className="container py-8 md:py-10">
      <div className="mx-auto mb-8 flex max-w-6xl items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Geographic spread</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One marker per ZIP, sized by anomaly score.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="mx-auto max-w-6xl space-y-4">
        {isLoading && <Skeleton className="h-[460px] w-full rounded-md" />}

        {!isLoading && <AnomalyMap anomalies={data?.anomalies ?? []} />}

        {isError && (
          <Card className="border-destructive/40">
            <CardContent className="flex items-start gap-3 py-6">
              <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
              <div className="space-y-1">
                <p className="font-medium">Couldn't reach the Epicenter backend</p>
                <p className="text-xs text-muted-foreground">{(error as Error)?.message}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
