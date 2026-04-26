import { ArrowDown, ArrowRight, ArrowUp, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendBadgeProps {
  trend: string;
  className?: string;
}

export function TrendBadge({ trend, className }: TrendBadgeProps) {
  const t = trend.toLowerCase();
  let Icon = ArrowRight;
  let tone = "text-muted-foreground";
  if (t === "accelerating") {
    Icon = TrendingUp;
    tone = "text-risk-outbreak";
  } else if (t === "increasing") {
    Icon = ArrowUp;
    tone = "text-risk-significant";
  } else if (t === "declining") {
    Icon = ArrowDown;
    tone = "text-risk-normal";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs capitalize",
        tone,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {trend}
    </span>
  );
}
