import { Kline, TechnicalAnalysis } from '@/types/market';

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
