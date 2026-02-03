"use client";

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
  Percent,
  ShieldAlert,
  Rocket,
  Ban
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
  // Calculate long/short recommendations based on signal
  const signalScore = indicators.signalScore || 0;
  
  // Long position sizing
  const longRecommendation = calculateLongPosition(signalScore, atr, action);
  
  // Short position sizing (inverse logic)
  const shortRecommendation = calculateShortPosition(signalScore, atr, action);
  
  // Calculate scenarios
  const scenarios = calculateScenarios(currentPrice, atr, indicators, action);

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
                  <Badge className="bg-green-500 ml-auto">추천</Badge>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">추천 비중</span>
                    <span className="font-bold">{longRecommendation.position}%</span>
                  </div>
                  <Progress value={longRecommendation.position} className="h-2" />
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">최대 레버리지</span>
                  <span className="font-medium">{longRecommendation.maxLeverage}x</span>
                </div>
                
                <div className="text-xs text-muted-foreground">
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
                  <Badge className="bg-red-500 ml-auto">추천</Badge>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">추천 비중</span>
                    <span className="font-bold">{shortRecommendation.position}%</span>
                  </div>
                  <Progress value={shortRecommendation.position} className="h-2" />
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">최대 레버리지</span>
                  <span className="font-medium">{shortRecommendation.maxLeverage}x</span>
                </div>
                
                <div className="text-xs text-muted-foreground">
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
                <Badge variant="outline" className="ml-auto text-green-500 border-green-500">
                  확률 {scenarios.bullish.probability}%
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">1차 목표:</span>
                  <span className="font-medium">${scenarios.bullish.target1.toLocaleString()}</span>
                  <span className="text-green-500">(+{scenarios.bullish.target1Pct.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">2차 목표:</span>
                  <span className="font-medium">${scenarios.bullish.target2.toLocaleString()}</span>
                  <span className="text-green-500">(+{scenarios.bullish.target2Pct.toFixed(1)}%)</span>
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
                <Badge variant="outline" className="ml-auto text-red-500 border-red-500">
                  확률 {scenarios.bearish.probability}%
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">1차 지지:</span>
                  <span className="font-medium">${scenarios.bearish.support1.toLocaleString()}</span>
                  <span className="text-red-500">({scenarios.bearish.support1Pct.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">손절가:</span>
                  <span className="font-medium">${scenarios.bearish.stopLoss.toLocaleString()}</span>
                  <span className="text-red-500">({scenarios.bearish.stopLossPct.toFixed(1)}%)</span>
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
                <Badge variant="outline" className="ml-auto text-yellow-500 border-yellow-500">
                  확률 {scenarios.sideways.probability}%
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">예상 레인지:</span>
                  <span className="font-medium">
                    ${scenarios.sideways.rangeLow.toLocaleString()} - ${scenarios.sideways.rangeHigh.toLocaleString()}
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
                <strong>주의:</strong> 이 분석은 기술적 지표 기반 참고용입니다. 
                실제 진입 시 본인의 리스크 관리 원칙을 따르세요. 
                레버리지 거래는 원금 손실 위험이 있습니다.
              </div>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions
function calculateLongPosition(signalScore: number, atr: ATRData, action: string) {
  const isBullish = action === 'strong_buy' || action === 'buy';
  const isNeutral = action === 'hold';
  
  let position = 0;
  let maxLeverage = 1;
  let reason = '';
  
  if (isBullish) {
    // Base position from signal score (0-100 mapped from 0-100 signal)
    position = Math.min(80, Math.max(20, 50 + signalScore * 0.3));
    
    // Adjust for volatility
    if (atr.volatility === 'extreme') {
      position = Math.floor(position * 0.5);
      maxLeverage = 1;
      reason = '신호 긍정적이나 변동성 극심 - 비중 축소';
    } else if (atr.volatility === 'high') {
      position = Math.floor(position * 0.7);
      maxLeverage = 2;
      reason = '상승 신호 + 높은 변동성 주의';
    } else if (atr.volatility === 'medium') {
      maxLeverage = 3;
      reason = '상승 신호 확인 - 적정 비중 진입';
    } else {
      maxLeverage = 5;
      reason = '강한 상승 신호 + 낮은 변동성';
    }
  } else if (isNeutral) {
    position = 10;
    maxLeverage = 1;
    reason = '중립 구간 - 관망 또는 소량만';
  } else {
    position = 0;
    maxLeverage = 1;
    reason = '하락 신호 - 롱 진입 비추천';
  }
  
  return {
    recommended: position >= 30,
    position: Math.round(position),
    maxLeverage,
    reason,
  };
}

function calculateShortPosition(signalScore: number, atr: ATRData, action: string) {
  const isBearish = action === 'strong_sell' || action === 'sell';
  const isNeutral = action === 'hold';
  
  let position = 0;
  let maxLeverage = 1;
  let reason = '';
  
  if (isBearish) {
    // Base position from inverted signal score
    position = Math.min(80, Math.max(20, 50 - signalScore * 0.3));
    
    // Adjust for volatility
    if (atr.volatility === 'extreme') {
      position = Math.floor(position * 0.5);
      maxLeverage = 1;
      reason = '하락 신호이나 변동성 극심 - 비중 축소';
    } else if (atr.volatility === 'high') {
      position = Math.floor(position * 0.7);
      maxLeverage = 2;
      reason = '하락 신호 + 높은 변동성 주의';
    } else if (atr.volatility === 'medium') {
      maxLeverage = 3;
      reason = '하락 신호 확인 - 적정 비중 진입';
    } else {
      maxLeverage = 5;
      reason = '강한 하락 신호 + 낮은 변동성';
    }
  } else if (isNeutral) {
    position = 10;
    maxLeverage = 1;
    reason = '중립 구간 - 관망 또는 소량만';
  } else {
    position = 0;
    maxLeverage = 1;
    reason = '상승 신호 - 숏 진입 비추천';
  }
  
  return {
    recommended: position >= 30,
    position: Math.round(position),
    maxLeverage,
    reason,
  };
}

function calculateScenarios(
  currentPrice: number, 
  atr: ATRData, 
  indicators: TechnicalIndicators,
  action: string
) {
  const atrValue = atr.atr;
  const atrPct = atr.atrPercent;
  const signalScore = indicators.signalScore || 0;
  
  // Probability based on signal score
  let bullProb = 50 + signalScore * 0.4;
  let bearProb = 50 - signalScore * 0.4;
  let sideProb = 100 - bullProb - bearProb + 20; // Overlap
  
  // Normalize
  const total = bullProb + bearProb + sideProb;
  bullProb = Math.round(bullProb / total * 100);
  bearProb = Math.round(bearProb / total * 100);
  sideProb = Math.round(sideProb / total * 100);
  
  // Use resistance/support from indicators if available
  const resistance1 = indicators.resistance?.[0]?.price || currentPrice * (1 + atrPct / 100 * 1.5);
  const resistance2 = indicators.resistance?.[1]?.price || currentPrice * (1 + atrPct / 100 * 3);
  const support1 = indicators.support?.[0]?.price || currentPrice * (1 - atrPct / 100 * 1.5);
  const stopLoss = currentPrice * (1 - atrPct / 100 * 2);
  
  return {
    bullish: {
      probability: Math.max(10, Math.min(80, bullProb)),
      target1: Math.round(resistance1 * 100) / 100,
      target1Pct: ((resistance1 - currentPrice) / currentPrice) * 100,
      target2: Math.round(resistance2 * 100) / 100,
      target2Pct: ((resistance2 - currentPrice) / currentPrice) * 100,
      action: signalScore > 30 
        ? '1차 목표 도달 시 50% 익절, 나머지 홀드'
        : '1차 목표 도달 시 70% 익절 권장',
    },
    bearish: {
      probability: Math.max(10, Math.min(80, bearProb)),
      support1: Math.round(support1 * 100) / 100,
      support1Pct: ((support1 - currentPrice) / currentPrice) * 100,
      stopLoss: Math.round(stopLoss * 100) / 100,
      stopLossPct: ((stopLoss - currentPrice) / currentPrice) * 100,
      action: signalScore < -30
        ? '지지선 이탈 시 손절, 반등 시 숏 진입 고려'
        : '손절가 도달 전 1차 지지에서 분할 청산 고려',
    },
    sideways: {
      probability: Math.max(10, Math.min(50, sideProb)),
      rangeLow: Math.round(support1 * 100) / 100,
      rangeHigh: Math.round(resistance1 * 100) / 100,
      action: '레인지 하단 매수, 상단 매도 - 그리드 전략 유효',
    },
  };
}
