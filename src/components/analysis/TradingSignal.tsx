"use client";

import { TradingSignal as TradingSignalType, MACD, BollingerBands, VolumeAnalysis } from "@/types/market";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";

interface TradingSignalProps {
  signal: TradingSignalType;
  macd: MACD;
  bollinger: BollingerBands;
  volume: VolumeAnalysis;
}

const ACTION_CONFIG = {
  strong_buy: { label: '강력 매수', color: 'bg-green-600', icon: TrendingUp },
  buy: { label: '매수', color: 'bg-green-500', icon: ArrowUp },
  hold: { label: '관망', color: 'bg-yellow-500', icon: Minus },
  sell: { label: '매도', color: 'bg-red-500', icon: ArrowDown },
  strong_sell: { label: '강력 매도', color: 'bg-red-600', icon: TrendingDown },
};

const CONFIDENCE_LABEL = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

export function TradingSignalComponent({ signal, macd, bollinger, volume }: TradingSignalProps) {
  const config = ACTION_CONFIG[signal.action];
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      {/* Main Signal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`${config.color} p-3 rounded-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold">{config.label}</div>
            <div className="text-sm text-muted-foreground">
              신뢰도: {CONFIDENCE_LABEL[signal.confidence]} | 점수: {signal.score > 0 ? '+' : ''}{signal.score}
            </div>
          </div>
        </div>
        <Badge variant={signal.score > 0 ? 'default' : signal.score < 0 ? 'destructive' : 'secondary'}>
          {signal.score > 0 ? '매수 우위' : signal.score < 0 ? '매도 우위' : '중립'}
        </Badge>
      </div>

      {/* Indicator Summary */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        {/* MACD */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />
            <span>MACD</span>
          </div>
          <div className={`font-medium ${macd.histogram > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {macd.histogram > 0 ? '상승' : '하락'}
          </div>
          {macd.crossover !== 'none' && (
            <Badge variant={macd.crossover === 'golden' ? 'default' : 'destructive'} className="mt-1">
              {macd.crossover === 'golden' ? '골든크로스' : '데드크로스'}
            </Badge>
          )}
        </div>

        {/* Bollinger Bands */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BarChart3 className="h-4 w-4" />
            <span>볼린저</span>
          </div>
          <div className="font-medium">
            %B: {bollinger.percentB.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">
            {bollinger.percentB < 20 ? '하단 근접' : bollinger.percentB > 80 ? '상단 근접' : '중간'}
          </div>
        </div>

        {/* Volume */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BarChart3 className="h-4 w-4" />
            <span>거래량</span>
          </div>
          <div className={`font-medium ${volume.trend === 'high' ? 'text-green-500' : volume.trend === 'low' ? 'text-red-500' : ''}`}>
            {volume.volumeRatio.toFixed(2)}x
          </div>
          <div className="text-xs text-muted-foreground">
            {volume.trend === 'high' ? '평균 대비 높음' : volume.trend === 'low' ? '평균 대비 낮음' : '평균 수준'}
          </div>
        </div>
      </div>

      {/* Reasons */}
      {signal.reasons.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-sm font-medium mb-2">판단 근거:</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            {signal.reasons.map((reason, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  reason.includes('매수') || reason.includes('상승') || reason.includes('골든') || reason.includes('지지') || reason.includes('하단')
                    ? 'bg-green-500' 
                    : reason.includes('매도') || reason.includes('하락') || reason.includes('데드') || reason.includes('저항') || reason.includes('상단')
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                }`} />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
