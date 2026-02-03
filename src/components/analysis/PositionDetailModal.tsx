"use client";

import { useState } from "react";
import { ATRData, PositionSizing as PositionSizingType, TechnicalIndicators } from "@/types/market";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogClose,
  DialogBody 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  ShieldAlert,
  Rocket,
  Settings2
} from "lucide-react";

interface PositionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol: string;
  currentPrice: number;
  positionSizing: PositionSizingType;
  atr: ATRData;
  indicators: TechnicalIndicators;
  action: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
}

const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10] as const;
type LeverageOption = typeof LEVERAGE_OPTIONS[number];

export function PositionDetailModal({
  open,
  onOpenChange,
  symbol,
  currentPrice,
  positionSizing,
  atr,
  indicators,
  action,
}: PositionDetailModalProps) {
  const [selectedLeverage, setSelectedLeverage] = useState<LeverageOption>(5);
  
  const signalScore = indicators.signalScore || 0;
  
  // Calculate positions based on selected leverage
  const longRecommendation = calculatePosition(signalScore, atr, action, selectedLeverage, 'long');
  const shortRecommendation = calculatePosition(signalScore, atr, action, selectedLeverage, 'short');
  
  // Calculate scenarios
  const scenarios = calculateScenarios(currentPrice, atr, indicators, action, selectedLeverage);
  
  // Liquidation price
  const liquidationPct = 100 / selectedLeverage;
  const longLiquidationPrice = currentPrice * (1 - liquidationPct / 100);
  const shortLiquidationPrice = currentPrice * (1 + liquidationPct / 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {symbol} 포지션 상세 분석
          </DialogTitle>
          <DialogClose onClose={() => onOpenChange(false)} />
        </DialogHeader>
        
        <DialogBody className="space-y-6">
          {/* Leverage Selector */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <span className="font-medium">레버리지 설정</span>
              </div>
              <div className="flex gap-1">
                {LEVERAGE_OPTIONS.map((lev) => (
                  <button
                    key={lev}
                    onClick={() => setSelectedLeverage(lev)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      selectedLeverage === lev
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {lev}x
                  </button>
                ))}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {selectedLeverage}x 레버리지 시 청산가: 롱 ${longLiquidationPrice.toFixed(2)} (-{liquidationPct.toFixed(0)}%) / 숏 ${shortLiquidationPrice.toFixed(2)} (+{liquidationPct.toFixed(0)}%)
            </div>
          </div>

          {/* Current Price & Signal */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground">현재가</div>
                <div className="text-2xl font-bold">${currentPrice.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">신호 점수</div>
                <div className={`text-2xl font-bold ${signalScore >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {signalScore > 0 ? '+' : ''}{signalScore}
                </div>
              </div>
            </div>
          </div>

          {/* Long & Short Recommendations */}
          <div className="grid grid-cols-2 gap-4">
            {/* Long Position */}
            <div className={`rounded-lg p-4 border-2 ${longRecommendation.recommended ? 'border-green-500/50 bg-green-500/10' : 'border-muted bg-muted/20'}`}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className={`h-5 w-5 ${longRecommendation.recommended ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span className="font-semibold">롱 포지션</span>
                {longRecommendation.recommended && (
                  <Badge className="bg-green-500 ml-auto text-xs">추천</Badge>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">진입금</span>
                    <span className="font-bold">{longRecommendation.entryPercent}%</span>
                  </div>
                  <Progress value={longRecommendation.entryPercent} className="h-2" />
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">실효 노출</span>
                    <span className="font-medium">{longRecommendation.effectiveExposure}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">손절가</span>
                    <span className="font-medium text-red-500">${longRecommendation.stopLoss.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                  {longRecommendation.reason}
                </div>
              </div>
            </div>

            {/* Short Position */}
            <div className={`rounded-lg p-4 border-2 ${shortRecommendation.recommended ? 'border-red-500/50 bg-red-500/10' : 'border-muted bg-muted/20'}`}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className={`h-5 w-5 ${shortRecommendation.recommended ? 'text-red-500' : 'text-muted-foreground'}`} />
                <span className="font-semibold">숏 포지션</span>
                {shortRecommendation.recommended && (
                  <Badge className="bg-red-500 ml-auto text-xs">추천</Badge>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">진입금</span>
                    <span className="font-bold">{shortRecommendation.entryPercent}%</span>
                  </div>
                  <Progress value={shortRecommendation.entryPercent} className="h-2" />
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">실효 노출</span>
                    <span className="font-medium">{shortRecommendation.effectiveExposure}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">손절가</span>
                    <span className="font-medium text-red-500">${shortRecommendation.stopLoss.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                  {shortRecommendation.reason}
                </div>
              </div>
            </div>
          </div>

          {/* Entry Scenarios */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              진입 후 시나리오
            </h3>

            {/* Bullish Scenario */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-medium text-green-500">상승 시나리오</span>
                <Badge variant="outline" className="ml-auto text-green-500 border-green-500 text-xs">
                  확률 {scenarios.bullish.probability}%
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">1차 목표:</span>
                  <span className="font-medium">${scenarios.bullish.target1.toFixed(2)}</span>
                  <span className="text-green-500">(+{scenarios.bullish.target1Pct.toFixed(1)}%)</span>
                  <span className="text-muted-foreground ml-auto">
                    롱 수익: +{(scenarios.bullish.target1Pct * selectedLeverage).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">2차 목표:</span>
                  <span className="font-medium">${scenarios.bullish.target2.toFixed(2)}</span>
                  <span className="text-green-500">(+{scenarios.bullish.target2Pct.toFixed(1)}%)</span>
                  <span className="text-muted-foreground ml-auto">
                    롱 수익: +{(scenarios.bullish.target2Pct * selectedLeverage).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-green-500/20">
                  <ArrowRight className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">{scenarios.bullish.action}</span>
                </div>
              </div>
            </div>

            {/* Bearish Scenario */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="font-medium text-red-500">하락 시나리오</span>
                <Badge variant="outline" className="ml-auto text-red-500 border-red-500 text-xs">
                  확률 {scenarios.bearish.probability}%
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">1차 지지:</span>
                  <span className="font-medium">${scenarios.bearish.support1.toFixed(2)}</span>
                  <span className="text-red-500">({scenarios.bearish.support1Pct.toFixed(1)}%)</span>
                  <span className="text-muted-foreground ml-auto">
                    롱 손실: {(scenarios.bearish.support1Pct * selectedLeverage).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">손절가:</span>
                  <span className="font-medium">${scenarios.bearish.stopLoss.toFixed(2)}</span>
                  <span className="text-red-500">({scenarios.bearish.stopLossPct.toFixed(1)}%)</span>
                  <span className="text-muted-foreground ml-auto">
                    롱 손실: {(scenarios.bearish.stopLossPct * selectedLeverage).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-red-500/20">
                  <ArrowRight className="h-4 w-4 text-red-500" />
                  <span className="text-muted-foreground">{scenarios.bearish.action}</span>
                </div>
              </div>
            </div>

            {/* Sideways Scenario */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <ArrowRight className="h-4 w-4 text-yellow-500" />
                <span className="font-medium text-yellow-500">횡보 시나리오</span>
                <Badge variant="outline" className="ml-auto text-yellow-500 border-yellow-500 text-xs">
                  확률 {scenarios.sideways.probability}%
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">예상 레인지:</span>
                  <span className="font-medium">
                    ${scenarios.sideways.rangeLow.toFixed(2)} - ${scenarios.sideways.rangeHigh.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-yellow-500/20">
                  <ArrowRight className="h-4 w-4 text-yellow-500" />
                  <span className="text-muted-foreground">{scenarios.sideways.action}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Warning */}
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
              <div>
                <strong>주의:</strong> {selectedLeverage}x 레버리지는 -{(100/selectedLeverage).toFixed(0)}% 가격 변동 시 청산됩니다. 
                반드시 손절가를 설정하고, 감당 가능한 금액만 투자하세요.
              </div>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions
function calculatePosition(
  signalScore: number, 
  atr: ATRData, 
  action: string, 
  leverage: number,
  direction: 'long' | 'short'
) {
  const isBullish = action === 'strong_buy' || action === 'buy';
  const isBearish = action === 'strong_sell' || action === 'sell';
  const isNeutral = action === 'hold';
  
  const isAligned = (direction === 'long' && isBullish) || (direction === 'short' && isBearish);
  const isOpposite = (direction === 'long' && isBearish) || (direction === 'short' && isBullish);
  
  let basePosition = 0;
  let reason = '';
  
  if (isAligned) {
    // Signal aligned with direction
    basePosition = Math.min(80, Math.max(30, 50 + Math.abs(signalScore) * 0.3));
    reason = direction === 'long' 
      ? '상승 신호 확인 - 롱 진입 적합' 
      : '하락 신호 확인 - 숏 진입 적합';
  } else if (isNeutral) {
    basePosition = 15;
    reason = '중립 구간 - 소량만 진입 권장';
  } else {
    basePosition = 0;
    reason = direction === 'long'
      ? '하락 신호 - 롱 진입 비추천'
      : '상승 신호 - 숏 진입 비추천';
  }
  
  // Volatility adjustment
  let volMultiplier = 1;
  if (atr.volatility === 'extreme') {
    volMultiplier = 0.4;
    reason += ' (변동성 극심 - 비중 대폭 축소)';
  } else if (atr.volatility === 'high') {
    volMultiplier = 0.6;
    reason += ' (변동성 높음 - 비중 축소)';
  } else if (atr.volatility === 'medium') {
    volMultiplier = 0.8;
  }
  
  // Entry percent for fixed leverage
  const entryPercent = Math.round((basePosition / leverage) * volMultiplier);
  const effectiveExposure = entryPercent * leverage;
  
  // Stop loss (ATR based)
  const stopLossPct = atr.atrPercent * 1.5;
  const stopLoss = direction === 'long'
    ? (1 - stopLossPct / 100)
    : (1 + stopLossPct / 100);
  
  return {
    recommended: entryPercent >= 8,
    entryPercent: Math.max(0, Math.min(50, entryPercent)),
    effectiveExposure,
    stopLoss: stopLoss * 35, // Placeholder, will use currentPrice in component
    reason,
  };
}

function calculateScenarios(
  currentPrice: number, 
  atr: ATRData, 
  indicators: TechnicalIndicators,
  action: string,
  leverage: number
) {
  const atrPct = atr.atrPercent;
  const signalScore = indicators.signalScore || 0;
  
  // Probability based on signal score
  let bullProb = 50 + signalScore * 0.4;
  let bearProb = 50 - signalScore * 0.4;
  let sideProb = 30;
  
  // Normalize
  const total = bullProb + bearProb + sideProb;
  bullProb = Math.round(bullProb / total * 100);
  bearProb = Math.round(bearProb / total * 100);
  sideProb = 100 - bullProb - bearProb;
  
  // Use resistance/support from indicators if available
  const resistance1 = indicators.resistance?.[0]?.price || currentPrice * (1 + atrPct / 100 * 2);
  const resistance2 = indicators.resistance?.[1]?.price || currentPrice * (1 + atrPct / 100 * 4);
  const support1 = indicators.support?.[0]?.price || currentPrice * (1 - atrPct / 100 * 2);
  const stopLoss = currentPrice * (1 - atrPct / 100 * 1.5);
  
  return {
    bullish: {
      probability: Math.max(15, Math.min(70, bullProb)),
      target1: resistance1,
      target1Pct: ((resistance1 - currentPrice) / currentPrice) * 100,
      target2: resistance2,
      target2Pct: ((resistance2 - currentPrice) / currentPrice) * 100,
      action: signalScore > 30 
        ? '1차 목표 도달 시 50% 익절, 나머지 트레일링 스탑'
        : '1차 목표 도달 시 70% 익절, 리스크 관리',
    },
    bearish: {
      probability: Math.max(15, Math.min(70, bearProb)),
      support1: support1,
      support1Pct: ((support1 - currentPrice) / currentPrice) * 100,
      stopLoss: stopLoss,
      stopLossPct: ((stopLoss - currentPrice) / currentPrice) * 100,
      action: `손절가 ${leverage}x 기준 ${(atrPct * 1.5 * leverage).toFixed(0)}% 손실 - 반드시 준수`,
    },
    sideways: {
      probability: Math.max(10, Math.min(40, sideProb)),
      rangeLow: support1,
      rangeHigh: resistance1,
      action: '레인지 하단 매수, 상단 매도 - 그리드 전략 유효',
    },
  };
}
