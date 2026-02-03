import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendBadgeProps {
  trend: "bullish" | "bearish" | "neutral";
}

export function TrendBadge({ trend }: TrendBadgeProps) {
  const config = {
    bullish: {
      variant: "bullish" as const,
      label: "Bullish",
      icon: TrendingUp,
    },
    bearish: {
      variant: "bearish" as const,
      label: "Bearish",
      icon: TrendingDown,
    },
    neutral: {
      variant: "neutral" as const,
      label: "Neutral",
      icon: Minus,
    },
  };

  const { variant, label, icon: Icon } = config[trend];

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
