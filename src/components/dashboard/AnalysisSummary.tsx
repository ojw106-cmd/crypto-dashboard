import { TechnicalAnalysis, Level, MACD, BollingerBands, VolumeAnalysis, TradingSignal } from "@/types/market";
import { TechnicalIndicators } from "@/components/analysis/TechnicalIndicators";
import { SupportResistance } from "@/components/analysis/SupportResistance";
import { TrendBadge } from "@/components/analysis/TrendBadge";
import { TradingSignalComponent } from "@/components/analysis/TradingSignal";

interface AnalysisSummaryProps {
  analysis: TechnicalAnalysis;
  levels: Level[];
  currentPrice: number;
  macd?: MACD;
  bollinger?: BollingerBands;
  volume?: VolumeAnalysis;
  tradingSignal?: TradingSignal;
}

export function AnalysisSummary({
  analysis,
  levels,
  currentPrice,
  macd,
  bollinger,
  volume,
  tradingSignal,
}: AnalysisSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Trend:</span>
        <TrendBadge trend={analysis.trend} />
      </div>

      {/* Trading Signal - New Feature */}
      {tradingSignal && macd && bollinger && volume && (
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 border border-primary/20">
          <h4 className="text-sm font-medium mb-3 text-primary">📊 AI 트레이딩 시그널</h4>
          <TradingSignalComponent 
            signal={tradingSignal} 
            macd={macd} 
            bollinger={bollinger} 
            volume={volume} 
          />
        </div>
      )}

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
