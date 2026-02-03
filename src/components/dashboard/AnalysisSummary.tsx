import { TechnicalAnalysis, Level } from "@/types/market";
import { TechnicalIndicators } from "@/components/analysis/TechnicalIndicators";
import { SupportResistance } from "@/components/analysis/SupportResistance";
import { TrendBadge } from "@/components/analysis/TrendBadge";

interface AnalysisSummaryProps {
  analysis: TechnicalAnalysis;
  levels: Level[];
  currentPrice: number;
}

export function AnalysisSummary({
  analysis,
  levels,
  currentPrice,
}: AnalysisSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Trend:</span>
        <TrendBadge trend={analysis.trend} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-secondary/30 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Technical Indicators</h4>
          <TechnicalIndicators analysis={analysis} currentPrice={currentPrice} />
        </div>

        <div className="bg-secondary/30 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Support / Resistance</h4>
          <SupportResistance levels={levels} />
        </div>
      </div>
    </div>
  );
}
