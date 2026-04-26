import { ArrowDownRight, ArrowRight, ArrowUpRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendBadgeProps {
  trend: string;
  className?: string;
}

export function TrendBadge({ trend, className }: TrendBadgeProps) {
  const t = trend.toLowerCase();
  let Icon = ArrowRight;
  let tone = "text-muted-foreground bg-muted/40 border-border";
  if (t === "accelerating") {
    Icon = Zap;
    tone = "text-risk-outbreak bg-risk-outbreak/15 border-risk-outbreak/30";
  } else if (t === "increasing") {
    Icon = ArrowUpRight;
    tone = "text-risk-significant bg-risk-significant/15 border-risk-significant/30";
  } else if (t === "declining") {
    Icon = ArrowDownRight;
    tone = "text-risk-normal bg-risk-normal/15 border-risk-normal/30";
  } else if (t === "stable") {
    Icon = ArrowRight;
    tone = "text-muted-foreground bg-muted/40 border-border";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        tone,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {trend}
    </span>
  );
}
