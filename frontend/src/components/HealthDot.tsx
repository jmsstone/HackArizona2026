import { useHealth } from "@/hooks/useHealth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function HealthDot() {
  const { data, isError, isLoading, dataUpdatedAt } = useHealth();
  const healthy = !!data && data.status === "healthy";
  const state = isLoading ? "loading" : healthy ? "ok" : "down";

  const dotClass =
    state === "ok"
      ? "bg-risk-normal"
      : state === "down"
      ? "bg-risk-outbreak"
      : "bg-muted-foreground/60";

  const label =
    state === "ok" ? "Connected" : state === "down" ? "Disconnected" : "Connecting";

  const lastChecked = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 text-xs">
          <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
          <span className="hidden sm:inline text-muted-foreground">{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <div className="text-xs">
          <div className="font-medium">
            {state === "ok" ? "Backend healthy" : state === "down" ? "Backend unreachable" : "Checking backend"}
          </div>
          <div className="text-muted-foreground">
            {isError ? "GET /api/health failed" : `Last checked ${lastChecked}`}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
