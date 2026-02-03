"use client";

import { ATRData, PositionSizing as PositionSizingType } from "@/types/market";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Shield, 
  Zap,
  AlertTriangle 
} from "lucide-react";

interface PositionSizingProps {
  positionSizing: PositionSizingType;
  atr: ATRData;
  action: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
}

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

export function PositionSizingComponent({ positionSizing, atr, action }: PositionSizingProps) {
  const riskConfig = RISK_CONFIG[positionSizing.riskLevel];
  const volatilityConfig = VOLATILITY_CONFIG[atr.volatility];
  const RiskIcon = riskConfig.icon;
  
  const isBuySignal = action === 'strong_buy' || action === 'buy';
  const isSellSignal = action === 'strong_sell' || action === 'sell';

  return (
    <div className="space-y-4">
      {/* Main Position Recommendation */}
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
            <span className="font-medium">추천 진입 비중</span>
          </div>
          <Badge className={riskConfig.color}>
            <RiskIcon className="h-3 w-3 mr-1" />
            {riskConfig.label}
          </Badge>
        </div>
        
        {/* Position Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">조정 후 비중</span>
            <span className="font-bold text-lg">
              {positionSizing.volatilityAdjusted}%
            </span>
          </div>
          <Progress 
            value={positionSizing.volatilityAdjusted} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>기본 비중: {positionSizing.basePosition}%</span>
            <span>
              {positionSizing.volatilityAdjusted > positionSizing.basePosition 
                ? `+${positionSizing.volatilityAdjusted - positionSizing.basePosition}% (변동성 보정)`
                : positionSizing.volatilityAdjusted < positionSizing.basePosition
                ? `${positionSizing.volatilityAdjusted - positionSizing.basePosition}% (변동성 보정)`
                : '변동성 보정 없음'
              }
            </span>
          </div>
        </div>
      </div>

      {/* ATR & Leverage */}
      <div className="grid grid-cols-2 gap-3">
        {/* Volatility */}
        <div className={`rounded-lg p-3 ${volatilityConfig.bgColor}`}>
          <div className="flex items-center gap-2 mb-1">
            <Activity className={`h-4 w-4 ${volatilityConfig.color}`} />
            <span className="text-sm text-muted-foreground">변동성 (ATR)</span>
          </div>
          <div className={`font-bold ${volatilityConfig.color}`}>
            {atr.atrPercent.toFixed(2)}%
          </div>
          <div className="text-xs text-muted-foreground">
            {volatilityConfig.label}
          </div>
        </div>

        {/* Max Leverage */}
        <div className="rounded-lg p-3 bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            {atr.volatility === 'extreme' ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <Zap className="h-4 w-4 text-purple-500" />
            )}
            <span className="text-sm text-muted-foreground">추천 최대 레버리지</span>
          </div>
          <div className={`font-bold ${atr.volatility === 'extreme' ? 'text-red-500' : 'text-purple-500'}`}>
            {positionSizing.maxLeverage}x
          </div>
          <div className="text-xs text-muted-foreground">
            {atr.volatility === 'extreme' ? '레버리지 비추천' : '변동성 기반'}
          </div>
        </div>
      </div>

      {/* Reasoning */}
      {positionSizing.reasoning.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-sm font-medium mb-2">📊 판단 근거</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            {positionSizing.reasoning.map((reason, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Guide */}
      <div className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-2">
        💡 <strong>가이드:</strong> 
        {positionSizing.volatilityAdjusted >= 70 
          ? ' 신호가 강함 - 적극 진입 가능하나 분할 매수 권장'
          : positionSizing.volatilityAdjusted >= 40
          ? ' 신호 보통 - 1/2~1/3 비중으로 진입, 추가 확인 후 증액'
          : positionSizing.volatilityAdjusted >= 20
          ? ' 신호 약함 - 소량 진입 또는 관망 권장'
          : ' 진입 비추천 - 포지션 축소 또는 청산 고려'
        }
      </div>
    </div>
  );
}
