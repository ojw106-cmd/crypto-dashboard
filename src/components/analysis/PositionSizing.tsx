"use client";

import { useState } from "react";
import { ATRData, PositionSizing as PositionSizingType, TechnicalIndicators } from "@/types/market";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PositionDetailModal } from "./PositionDetailModal";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Shield, 
  Zap,
  AlertTriangle,
  ExternalLink,
  Target
} from "lucide-react";

interface PositionSizingProps {
  positionSizing: PositionSizingType;
  atr: ATRData;
  action: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  symbol?: string;
  currentPrice?: number;
  indicators?: TechnicalIndicators;
}

const FIXED_LEVERAGE = 5;

const RISK_CONFIG = {
  conservative: { label: '보수적', color: 'bg-blue-500', icon: Shield },
  moderate: { label: '중립', color: 'bg-yellow-500', icon: Activity },
  aggressive: { label: '공격적', color: 'bg-red-500', icon: Zap },
};

const VOLATILITY_CONFIG = {
  low: { label: '낮음', color: 'text-green-500', bgColor: 'bg-green-500/20' },
  medium: { label: '보통', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
  high: { label: '높음', color: 'text-orange-500', bgColor: 'bg-orange-500/20' },
  extreme: { label: '극심', color: 'text-red-500', bgColor: 'bg-red-500/20' },
};

// Calculate position size for fixed leverage
function calculateFixedLeveragePosition(
  basePosition: number, 
  atr: ATRData, 
  leverage: number
): { entryPercent: number; effectiveExposure: number; stopLossPct: number; liquidationPct: number } {
  // Base effective exposure from signal
  const targetExposure = basePosition; // This is what we want as effective exposure
  
  // Adjust for volatility - higher volatility = smaller position
  let volMultiplier = 1;
  if (atr.volatility === 'extreme') {
    volMultiplier = 0.4;
  } else if (atr.volatility === 'high') {
    volMultiplier = 0.6;
  } else if (atr.volatility === 'medium') {
    volMultiplier = 0.8;
  }
  
  // Entry percent = target exposure / leverage, adjusted for volatility
  const entryPercent = Math.round((targetExposure / leverage) * volMultiplier);
  const effectiveExposure = entryPercent * leverage;
  
  // Stop loss based on ATR (1.5x ATR)
  const stopLossPct = Math.round(atr.atrPercent * 1.5 * 10) / 10;
  
  // Liquidation price (for long: price drop that wipes margin)
  // At 5x leverage, 20% drop = liquidation (100% / leverage)
  const liquidationPct = Math.round(100 / leverage);
  
  return {
    entryPercent: Math.max(0, Math.min(100, entryPercent)),
    effectiveExposure,
    stopLossPct,
    liquidationPct,
  };
}

export function PositionSizingComponent({ 
  positionSizing, 
  atr, 
  action,
  symbol = "HYPE",
  currentPrice = 0,
  indicators
}: PositionSizingProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  
  const riskConfig = RISK_CONFIG[positionSizing.riskLevel];
  const volatilityConfig = VOLATILITY_CONFIG[atr.volatility];
  const RiskIcon = riskConfig.icon;
  
  const isBuySignal = action === 'strong_buy' || action === 'buy';
  const isSellSignal = action === 'strong_sell' || action === 'sell';

  // Calculate fixed leverage position
  const fixedPos = calculateFixedLeveragePosition(
    positionSizing.basePosition,
    atr,
    FIXED_LEVERAGE
  );
  
  // Stop loss and liquidation prices
  const stopLossPrice = currentPrice > 0 ? currentPrice * (1 - fixedPos.stopLossPct / 100) : 0;
  const liquidationPrice = currentPrice > 0 ? currentPrice * (1 - fixedPos.liquidationPct / 100) : 0;

  // Default indicators if not provided
  const defaultIndicators: TechnicalIndicators = indicators || {
    ema: { ema7: 0, ema20: 0, ema50: 0, trend: 'neutral' },
    rsi: { value: 50, condition: 'neutral' },
    macd: { macd: 0, signal: 0, histogram: 0, trend: 'neutral' },
    bollingerBands: { upper: 0, middle: 0, lower: 0, position: 'middle' },
    support: [],
    resistance: [],
    signalScore: 0,
  };

  return (
    <div className="space-y-4">
      {/* Detail Modal */}
      <PositionDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        symbol={symbol}
        currentPrice={currentPrice}
        positionSizing={positionSizing}
        atr={atr}
        indicators={defaultIndicators}
        action={action}
      />

      {/* Main Position Recommendation - 5x Fixed */}
      <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isBuySignal ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : isSellSignal ? (
              <TrendingDown className="h-5 w-5 text-red-500" />
            ) : (
              <Activity className="h-5 w-5 text-yellow-500" />
            )}
            <span className="font-medium">추천 진입금</span>
            <Badge variant="outline" className="text-xs">
              {FIXED_LEVERAGE}x 고정
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={riskConfig.color}>
              <RiskIcon className="h-3 w-3 mr-1" />
              {riskConfig.label}
            </Badge>
            <button
              onClick={() => setDetailOpen(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
            >
              상세
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
        
        {/* Entry Amount Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">자본 대비 진입금</span>
            <span className="font-bold text-lg">
              {fixedPos.entryPercent}%
            </span>
          </div>
          <Progress 
            value={fixedPos.entryPercent} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>실효 노출: {fixedPos.effectiveExposure}%</span>
            <span>
              {isBuySignal ? '롱' : isSellSignal ? '숏' : '관망'} 포지션
            </span>
          </div>
        </div>
      </div>

      {/* Risk Info - 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        {/* Volatility */}
        <div className={`rounded-lg p-3 ${volatilityConfig.bgColor}`}>
          <div className="flex items-center gap-2 mb-1">
            <Activity className={`h-4 w-4 ${volatilityConfig.color}`} />
            <span className="text-sm text-muted-foreground">변동성</span>
          </div>
          <div className={`font-bold ${volatilityConfig.color}`}>
            {atr.atrPercent.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">
            {volatilityConfig.label}
          </div>
        </div>

        {/* Stop Loss */}
        <div className="rounded-lg p-3 bg-red-500/10">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-muted-foreground">손절가</span>
          </div>
          <div className="font-bold text-red-500">
            ${stopLossPrice.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">
            -{fixedPos.stopLossPct}% (ATR 기반)
          </div>
        </div>
      </div>

      {/* Liquidation Warning */}
      <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-3">
        <Target className="h-4 w-4 text-muted-foreground" />
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">청산가:</span> ${liquidationPrice.toFixed(2)} (-{fixedPos.liquidationPct}%)
          <span className="ml-2">|</span>
          <span className="ml-2">손절 전 청산 거리: {(fixedPos.liquidationPct - fixedPos.stopLossPct).toFixed(1)}%</span>
        </div>
      </div>

      {/* Quick Guide */}
      <div className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-2">
        💡 <strong>가이드:</strong> 
        {fixedPos.entryPercent >= 15 
          ? ` ${fixedPos.entryPercent}% 진입 권장 → 반씩 분할 진입 (${Math.round(fixedPos.entryPercent/2)}% × 2)`
          : fixedPos.entryPercent >= 8
          ? ` ${fixedPos.entryPercent}% 진입 권장 → 신호 확인 후 일괄 진입`
          : ' 진입 비추천 - 더 좋은 기회 대기'
        }
      </div>
    </div>
  );
}
