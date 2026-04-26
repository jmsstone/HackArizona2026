import { useHealth } from "@/hooks/useHealth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function HealthDot() {
  const { data, isError, isLoading, dataUpdatedAt } = useHealth();
  const healthy = !!data && data.status === "healthy";
  const state = isLoading ? "loading" : healthy ? "ok" : "down";

  const dotClass =
    state === "ok"
      ? "bg-risk-normal shadow-[0_0_10px_hsl(var(--risk-normal)/0.7)]"
      : state === "down"
      ? "bg-risk-outbreak shadow-[0_0_10px_hsl(var(--risk-outbreak)/0.7)]"
      : "bg-muted-foreground";

  const label =
    state === "ok"
      ? "Backend healthy"
      : state === "down"
      ? "Backend unreachable"
      : "Checking backend…";

  const lastChecked = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card/50 px-2.5 py-1 text-xs">
          <span className={cn("h-2 w-2 rounded-full animate-pulse-dot", dotClass)} />
          <span className="hidden sm:inline text-muted-foreground">{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <div className="text-xs">
          <div className="font-medium">{label}</div>
          <div className="text-muted-foreground">
            {isError ? "GET /api/health failed" : `Last checked ${lastChecked}`}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
