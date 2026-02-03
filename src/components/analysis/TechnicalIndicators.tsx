import { TechnicalAnalysis } from "@/types/market";
import { formatPrice } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TechnicalIndicatorsProps {
  analysis: TechnicalAnalysis;
  currentPrice: number;
}

export function TechnicalIndicators({
  analysis,
  currentPrice,
}: TechnicalIndicatorsProps) {
  const { ema7, ema20, ema50, rsi } = analysis;

  const getEmaIndicator = (ema: number) => {
    if (currentPrice > ema) {
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    }
    return <TrendingDown className="h-3 w-3 text-red-500" />;
  };

  const getRsiColor = (rsi: number) => {
    if (rsi >= 70) return "text-red-500";
    if (rsi <= 30) return "text-green-500";
    return "text-yellow-500";
  };

  const getRsiLabel = (rsi: number) => {
    if (rsi >= 70) return "Overbought";
    if (rsi <= 30) return "Oversold";
    return "Neutral";
  };

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">EMA 7</span>
        <span className="flex items-center gap-1">
          ${formatPrice(ema7)} {getEmaIndicator(ema7)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">EMA 20</span>
        <span className="flex items-center gap-1">
          ${formatPrice(ema20)} {getEmaIndicator(ema20)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">EMA 50</span>
        <span className="flex items-center gap-1">
          ${formatPrice(ema50)} {getEmaIndicator(ema50)}
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2">
        <span className="text-muted-foreground">RSI (14)</span>
        <span className={`flex items-center gap-1 ${getRsiColor(rsi)}`}>
          {rsi.toFixed(1)}
          <span className="text-xs">({getRsiLabel(rsi)})</span>
        </span>
      </div>
    </div>
  );
}
