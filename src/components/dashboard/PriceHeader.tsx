import { formatPrice, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceHeaderProps {
  symbol: string;
  price: number;
  priceChange: number;
}

export function PriceHeader({ symbol, price, priceChange }: PriceHeaderProps) {
  const isPositive = priceChange >= 0;

  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-xl font-semibold text-muted-foreground">{symbol}</h3>
        <p className="text-4xl font-bold">${formatPrice(price)}</p>
      </div>
      <div
        className={`flex items-center gap-2 text-lg font-semibold px-4 py-2 rounded-lg ${
          isPositive ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
        }`}
      >
        {isPositive ? (
          <TrendingUp className="h-5 w-5" />
        ) : (
          <TrendingDown className="h-5 w-5" />
        )}
        {formatPercent(priceChange)}
      </div>
    </div>
  );
}
