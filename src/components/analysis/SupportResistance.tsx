import { Level } from "@/types/market";
import { formatPrice } from "@/lib/utils";

interface SupportResistanceProps {
  levels: Level[];
}

export function SupportResistance({ levels }: SupportResistanceProps) {
  const resistances = levels.filter((l) => l.type === "resistance").slice(0, 3);
  const supports = levels.filter((l) => l.type === "support").slice(0, 3);

  if (levels.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Not enough data for levels
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      {resistances.map((level, i) => (
        <div key={`r-${i}`} className="flex items-center justify-between">
          <span className="text-red-500">R{i + 1}</span>
          <span className="flex items-center gap-2">
            <span>${formatPrice(level.price)}</span>
            <div
              className="h-1.5 bg-red-500/30 rounded"
              style={{ width: `${level.strength * 40}px` }}
            />
          </span>
        </div>
      ))}
      <div className="border-t border-border my-1" />
      {supports.map((level, i) => (
        <div key={`s-${i}`} className="flex items-center justify-between">
          <span className="text-green-500">S{i + 1}</span>
          <span className="flex items-center gap-2">
            <span>${formatPrice(level.price)}</span>
            <div
              className="h-1.5 bg-green-500/30 rounded"
              style={{ width: `${level.strength * 40}px` }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}
