import { riskClasses, type RiskKey } from "@/lib/api";
import { cn } from "@/lib/utils";

interface RiskScoreBarProps {
  score: number;
  riskKey: RiskKey;
  className?: string;
}

export function RiskScoreBar({ score, riskKey, className }: RiskScoreBarProps) {
  const r = riskClasses(riskKey);
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Anomaly score
        </span>
        <span className="text-sm font-semibold numeric text-foreground">{score}</span>
      </div>
      <div className="relative h-1 w-full overflow-hidden rounded-sm bg-border">
        <div
          aria-hidden
          className={cn("h-full transition-all duration-500", r.bg)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
