import { Progress } from "@/components/ui/progress";
import { riskClasses, type RiskKey } from "@/lib/api";
import { cn } from "@/lib/utils";

interface RiskScoreBarProps {
  score: number;
  riskKey: RiskKey;
  className?: string;
}

export function RiskScoreBar({ score, riskKey, className }: RiskScoreBarProps) {
  const r = riskClasses(riskKey);
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">Anomaly score</span>
        <span className={cn("text-lg font-semibold numeric", r.text)}>{score}</span>
      </div>
      <Progress
        value={score}
        className="h-2 bg-muted [&>div]:transition-all"
        // override indicator color via inline style hook
      />
      <div
        aria-hidden
        className={cn("h-2 -mt-2 rounded-full transition-all", r.bg)}
        style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
      />
    </div>
  );
}
