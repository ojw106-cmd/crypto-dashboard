import { TechnicalAnalysis, Level, MACD, BollingerBands, VolumeAnalysis, TradingSignal, ATRData, PositionSizing } from "@/types/market";
import { TechnicalIndicators } from "@/components/analysis/TechnicalIndicators";
import { SupportResistance } from "@/components/analysis/SupportResistance";
import { TrendBadge } from "@/components/analysis/TrendBadge";
import { TradingSignalComponent } from "@/components/analysis/TradingSignal";
import { PositionSizingComponent } from "@/components/analysis/PositionSizing";

interface AnalysisSummaryProps {
  analysis: TechnicalAnalysis;
  levels: Level[];
  currentPrice: number;
  macd?: MACD;
  bollinger?: BollingerBands;
  volume?: VolumeAnalysis;
  tradingSignal?: TradingSignal;
  atr?: ATRData;
  positionSizing?: PositionSizing;
}

export function AnalysisSummary({
  analysis,
  levels,
  currentPrice,
  macd,
  bollinger,
  volume,
  tradingSignal,
  atr,
  positionSizing,
}: AnalysisSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Trend:</span>
        <TrendBadge trend={analysis.trend} />
      </div>

      {/* Trading Signal & Position Sizing - Side by Side on desktop */}
      {tradingSignal && macd && bollinger && volume && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 border border-primary/20">
            <h4 className="text-sm font-medium mb-3 text-primary">📊 AI 트레이딩 시그널</h4>
            <TradingSignalComponent 
              signal={tradingSignal} 
              macd={macd} 
              bollinger={bollinger} 
              volume={volume} 
            />
          </div>
          
          {atr && positionSizing && (
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
              <h4 className="text-sm font-medium mb-3 text-purple-400">💰 포지션 사이징</h4>
              <PositionSizingComponent 
                positionSizing={positionSizing}
                atr={atr}
                action={tradingSignal.action}
              />
            </div>
          )}
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
