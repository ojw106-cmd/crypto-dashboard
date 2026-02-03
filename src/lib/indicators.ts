import { Kline, TechnicalAnalysis, MACD, BollingerBands, VolumeAnalysis, TradingSignal, ATRData, PositionSizing } from '@/types/market';

export function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return 0;

  const slice = prices.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / period;
}

export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return 0;

  const k = 2 / (period + 1);
  let ema = calculateSMA(prices.slice(0, period), period);

  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return ema;
}

export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;

  // Initial average
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }

  avgGain /= period;
  avgLoss /= period;

  // Smoothed average
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return rsi;
}

export function determineTrend(
  ema7: number,
  ema20: number,
  ema50: number,
  rsi: number
): 'bullish' | 'bearish' | 'neutral' {
  let bullishSignals = 0;
  let bearishSignals = 0;

  // EMA alignment
  if (ema7 > ema20 && ema20 > ema50) {
    bullishSignals += 2;
  } else if (ema7 < ema20 && ema20 < ema50) {
    bearishSignals += 2;
  }

  // EMA7 vs EMA20
  if (ema7 > ema20) {
    bullishSignals += 1;
  } else if (ema7 < ema20) {
    bearishSignals += 1;
  }

  // RSI
  if (rsi > 60) {
    bullishSignals += 1;
  } else if (rsi < 40) {
    bearishSignals += 1;
  }

  if (bullishSignals >= 3) return 'bullish';
  if (bearishSignals >= 3) return 'bearish';
  return 'neutral';
}

export function calculateTechnicalAnalysis(klines: Kline[]): TechnicalAnalysis {
  const closePrices = klines.map((k) => k.close);

  const ema7 = calculateEMA(closePrices, 7);
  const ema20 = calculateEMA(closePrices, 20);
  const ema50 = calculateEMA(closePrices, 50);
  const rsi = calculateRSI(closePrices, 14);
  const trend = determineTrend(ema7, ema20, ema50, rsi);

  return {
    ema7,
    ema20,
    ema50,
    rsi,
    trend,
  };
}

// MACD 계산
export function calculateMACD(prices: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): MACD {
  if (prices.length < slowPeriod + signalPeriod) {
    return { macd: 0, signal: 0, histogram: 0, crossover: 'none' };
  }

  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  const macdLine = fastEMA - slowEMA;

  // MACD line history for signal calculation
  const macdHistory: number[] = [];
  for (let i = slowPeriod; i <= prices.length; i++) {
    const slicedPrices = prices.slice(0, i);
    const fast = calculateEMA(slicedPrices, fastPeriod);
    const slow = calculateEMA(slicedPrices, slowPeriod);
    macdHistory.push(fast - slow);
  }

  const signalLine = macdHistory.length >= signalPeriod 
    ? calculateEMA(macdHistory, signalPeriod) 
    : macdLine;
  const histogram = macdLine - signalLine;

  // Crossover detection
  let crossover: 'golden' | 'death' | 'none' = 'none';
  if (macdHistory.length >= 2) {
    const prevMACD = macdHistory[macdHistory.length - 2];
    const prevSignal = macdHistory.length >= signalPeriod + 1
      ? calculateEMA(macdHistory.slice(0, -1), signalPeriod)
      : prevMACD;
    
    if (prevMACD <= prevSignal && macdLine > signalLine) {
      crossover = 'golden';
    } else if (prevMACD >= prevSignal && macdLine < signalLine) {
      crossover = 'death';
    }
  }

  return { macd: macdLine, signal: signalLine, histogram, crossover };
}

// 볼린저밴드 계산
export function calculateBollingerBands(prices: number[], period = 20, stdDev = 2): BollingerBands {
  if (prices.length < period) {
    const price = prices[prices.length - 1] || 0;
    return { upper: price, middle: price, lower: price, bandwidth: 0, percentB: 50 };
  }

  const middle = calculateSMA(prices, period);
  
  // Standard deviation
  const slice = prices.slice(-period);
  const squaredDiffs = slice.map(p => Math.pow(p - middle, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / period;
  const std = Math.sqrt(variance);

  const upper = middle + stdDev * std;
  const lower = middle - stdDev * std;
  const bandwidth = ((upper - lower) / middle) * 100;
  
  const currentPrice = prices[prices.length - 1];
  const percentB = upper !== lower ? ((currentPrice - lower) / (upper - lower)) * 100 : 50;

  return { upper, middle, lower, bandwidth, percentB };
}

// 볼륨 분석
export function analyzeVolume(klines: Kline[], period = 20): VolumeAnalysis {
  if (klines.length < period) {
    return { currentVolume: 0, avgVolume: 0, volumeRatio: 1, trend: 'normal' };
  }

  const volumes = klines.map(k => k.volume);
  const currentVolume = volumes[volumes.length - 1];
  const avgVolume = volumes.slice(-period).reduce((sum, v) => sum + v, 0) / period;
  const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;

  let trend: 'high' | 'low' | 'normal' = 'normal';
  if (volumeRatio > 1.5) trend = 'high';
  else if (volumeRatio < 0.5) trend = 'low';

  return { currentVolume, avgVolume, volumeRatio, trend };
}

// 피보나치 레벨 계산
export function calculateFibonacciLevels(klines: Kline[], lookbackPeriod = 50): { price: number; level: string }[] {
  if (klines.length < lookbackPeriod) return [];

  const recentKlines = klines.slice(-lookbackPeriod);
  const high = Math.max(...recentKlines.map(k => k.high));
  const low = Math.min(...recentKlines.map(k => k.low));
  const diff = high - low;

  const levels = [
    { level: '0%', price: low },
    { level: '23.6%', price: low + diff * 0.236 },
    { level: '38.2%', price: low + diff * 0.382 },
    { level: '50%', price: low + diff * 0.5 },
    { level: '61.8%', price: low + diff * 0.618 },
    { level: '78.6%', price: low + diff * 0.786 },
    { level: '100%', price: high },
  ];

  return levels;
}

// 종합 트레이딩 시그널 생성
export function generateTradingSignal(
  analysis: TechnicalAnalysis,
  macd: MACD,
  bollinger: BollingerBands,
  volume: VolumeAnalysis,
  currentPrice: number,
  supportLevels: number[],
  resistanceLevels: number[]
): TradingSignal {
  let score = 0; // -100 (강한 매도) ~ +100 (강한 매수)
  const reasons: string[] = [];

  // 1. RSI 분석 (가중치: 20)
  if (analysis.rsi < 30) {
    score += 20;
    reasons.push(`RSI 과매도 (${analysis.rsi.toFixed(1)})`);
  } else if (analysis.rsi < 40) {
    score += 10;
    reasons.push(`RSI 낮음 (${analysis.rsi.toFixed(1)})`);
  } else if (analysis.rsi > 70) {
    score -= 20;
    reasons.push(`RSI 과매수 (${analysis.rsi.toFixed(1)})`);
  } else if (analysis.rsi > 60) {
    score -= 10;
    reasons.push(`RSI 높음 (${analysis.rsi.toFixed(1)})`);
  }

  // 2. MACD 분석 (가중치: 25)
  if (macd.crossover === 'golden') {
    score += 25;
    reasons.push('MACD 골든크로스');
  } else if (macd.crossover === 'death') {
    score -= 25;
    reasons.push('MACD 데드크로스');
  } else if (macd.histogram > 0 && macd.macd > 0) {
    score += 10;
    reasons.push('MACD 상승세');
  } else if (macd.histogram < 0 && macd.macd < 0) {
    score -= 10;
    reasons.push('MACD 하락세');
  }

  // 3. 볼린저밴드 분석 (가중치: 20)
  if (bollinger.percentB < 10) {
    score += 20;
    reasons.push('볼린저밴드 하단 터치');
  } else if (bollinger.percentB < 25) {
    score += 10;
    reasons.push('볼린저밴드 하단 근접');
  } else if (bollinger.percentB > 90) {
    score -= 20;
    reasons.push('볼린저밴드 상단 터치');
  } else if (bollinger.percentB > 75) {
    score -= 10;
    reasons.push('볼린저밴드 상단 근접');
  }

  // 4. 볼륨 분석 (가중치: 15)
  if (volume.trend === 'high') {
    // 고볼륨 + 가격 방향에 따라 판단
    if (analysis.trend === 'bullish') {
      score += 15;
      reasons.push('고볼륨 상승');
    } else if (analysis.trend === 'bearish') {
      score -= 15;
      reasons.push('고볼륨 하락');
    }
  }

  // 5. 지지/저항선 근접도 (가중치: 20)
  const nearestSupport = supportLevels.length > 0 ? Math.max(...supportLevels.filter(s => s < currentPrice)) : 0;
  const nearestResistance = resistanceLevels.length > 0 ? Math.min(...resistanceLevels.filter(r => r > currentPrice)) : Infinity;
  
  const supportDistance = nearestSupport > 0 ? (currentPrice - nearestSupport) / currentPrice : 1;
  const resistanceDistance = nearestResistance < Infinity ? (nearestResistance - currentPrice) / currentPrice : 1;

  if (supportDistance < 0.02) {
    score += 20;
    reasons.push('지지선 근접');
  } else if (supportDistance < 0.05) {
    score += 10;
    reasons.push('지지선 인근');
  }

  if (resistanceDistance < 0.02) {
    score -= 20;
    reasons.push('저항선 근접');
  } else if (resistanceDistance < 0.05) {
    score -= 10;
    reasons.push('저항선 인근');
  }

  // 종합 판단
  let action: TradingSignal['action'];
  let confidence: TradingSignal['confidence'];

  if (score >= 50) {
    action = 'strong_buy';
    confidence = 'high';
  } else if (score >= 25) {
    action = 'buy';
    confidence = score >= 40 ? 'medium' : 'low';
  } else if (score <= -50) {
    action = 'strong_sell';
    confidence = 'high';
  } else if (score <= -25) {
    action = 'sell';
    confidence = score <= -40 ? 'medium' : 'low';
  } else {
    action = 'hold';
    confidence = 'medium';
  }

  return {
    action,
    confidence,
    score,
    reasons,
    timestamp: Date.now(),
  };
}

// ATR (Average True Range) 계산
export function calculateATR(klines: Kline[], period = 14): ATRData {
  if (klines.length < period + 1) {
    return { atr: 0, atrPercent: 0, volatility: 'medium' };
  }

  const trueRanges: number[] = [];
  
  for (let i = 1; i < klines.length; i++) {
    const current = klines[i];
    const prevClose = klines[i - 1].close;
    
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prevClose),
      Math.abs(current.low - prevClose)
    );
    trueRanges.push(tr);
  }

  // Calculate ATR using EMA-style smoothing
  let atr = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
  
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
  }

  const currentPrice = klines[klines.length - 1].close;
  const atrPercent = (atr / currentPrice) * 100;

  // Volatility classification
  let volatility: ATRData['volatility'];
  if (atrPercent < 2) volatility = 'low';
  else if (atrPercent < 4) volatility = 'medium';
  else if (atrPercent < 7) volatility = 'high';
  else volatility = 'extreme';

  return { atr, atrPercent, volatility };
}

// 포지션 사이징 계산
export function calculatePositionSizing(
  signal: TradingSignal,
  atr: ATRData
): PositionSizing {
  const reasoning: string[] = [];

  // 1. 기본 포지션: 시그널 점수 기반 (0-100%)
  // 점수가 양수면 매수 비중, 음수면 매도/현금 비중으로 해석
  const absScore = Math.abs(signal.score);
  let basePosition = 0;
  
  if (signal.action === 'strong_buy') {
    basePosition = 80 + (absScore - 50) * 0.4; // 80-100%
    reasoning.push(`강력 매수 시그널 (점수: ${signal.score})`);
  } else if (signal.action === 'buy') {
    basePosition = 50 + (absScore - 25) * 1.2; // 50-80%
    reasoning.push(`매수 시그널 (점수: ${signal.score})`);
  } else if (signal.action === 'hold') {
    basePosition = 30 + absScore; // 30-55%
    reasoning.push(`관망 시그널 - 기존 포지션 유지`);
  } else if (signal.action === 'sell') {
    basePosition = Math.max(10, 30 - (absScore - 25) * 0.8); // 10-30%
    reasoning.push(`매도 시그널 - 비중 축소 권장`);
  } else { // strong_sell
    basePosition = Math.max(0, 10 - (absScore - 50) * 0.2); // 0-10%
    reasoning.push(`강력 매도 시그널 - 포지션 정리 권장`);
  }

  // 2. 변동성 조정
  let volatilityMultiplier = 1;
  let maxLeverage = 1;

  switch (atr.volatility) {
    case 'low':
      volatilityMultiplier = 1.2; // 변동성 낮으면 비중 UP
      maxLeverage = 5;
      reasoning.push(`낮은 변동성 (ATR ${atr.atrPercent.toFixed(1)}%) → 비중 +20%`);
      break;
    case 'medium':
      volatilityMultiplier = 1.0;
      maxLeverage = 3;
      reasoning.push(`보통 변동성 (ATR ${atr.atrPercent.toFixed(1)}%)`);
      break;
    case 'high':
      volatilityMultiplier = 0.7; // 변동성 높으면 비중 DOWN
      maxLeverage = 2;
      reasoning.push(`높은 변동성 (ATR ${atr.atrPercent.toFixed(1)}%) → 비중 -30%`);
      break;
    case 'extreme':
      volatilityMultiplier = 0.5; // 극단적 변동성은 절반
      maxLeverage = 1;
      reasoning.push(`극심한 변동성 (ATR ${atr.atrPercent.toFixed(1)}%) → 비중 -50%, 레버리지 비추`);
      break;
  }

  const volatilityAdjusted = Math.min(100, Math.max(0, basePosition * volatilityMultiplier));

  // 3. 리스크 레벨 결정
  let riskLevel: PositionSizing['riskLevel'];
  if (volatilityAdjusted >= 70) {
    riskLevel = 'aggressive';
  } else if (volatilityAdjusted >= 40) {
    riskLevel = 'moderate';
  } else {
    riskLevel = 'conservative';
  }

  return {
    basePosition: Math.round(basePosition),
    volatilityAdjusted: Math.round(volatilityAdjusted),
    riskLevel,
    maxLeverage,
    reasoning,
  };
}
