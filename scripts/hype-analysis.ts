#!/usr/bin/env npx ts-node
/**
 * HYPE Analysis Script
 * Fetches current HYPE data and provides technical analysis
 * Used by /hypecmt command
 */

interface Kline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AnalysisResult {
  price: number;
  change24h: number;
  rsi: number;
  ema7: number;
  ema20: number;
  ema50: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  macdCrossover: 'golden' | 'death' | 'none';
  macdHistogram: number;
  bollingerPercentB: number;
  atrPercent: number;
  volatility: 'low' | 'medium' | 'high' | 'extreme';
  signalScore: number;
  signalAction: string;
  positionSize: number;
  maxLeverage: number;
  reasons: string[];
}

async function fetchKlines(symbol: string, interval: string, limit: number): Promise<Kline[]> {
  const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const response = await fetch(url);
  const data = await response.json();
  
  return data.map((k: any[]) => ({
    time: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  let avgGain = 0, avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;
  
  for (let i = period; i < changes.length; i++) {
    if (changes[i] > 0) {
      avgGain = (avgGain * (period - 1) + changes[i]) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(changes[i])) / period;
    }
  }
  
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function calculateATR(klines: Kline[], period: number = 14): { atrPercent: number; volatility: string } {
  if (klines.length < period + 1) return { atrPercent: 0, volatility: 'medium' };
  
  const trueRanges = [];
  for (let i = 1; i < klines.length; i++) {
    const tr = Math.max(
      klines[i].high - klines[i].low,
      Math.abs(klines[i].high - klines[i - 1].close),
      Math.abs(klines[i].low - klines[i - 1].close)
    );
    trueRanges.push(tr);
  }
  
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
  }
  
  const atrPercent = (atr / klines[klines.length - 1].close) * 100;
  let volatility = 'medium';
  if (atrPercent < 2) volatility = 'low';
  else if (atrPercent < 4) volatility = 'medium';
  else if (atrPercent < 7) volatility = 'high';
  else volatility = 'extreme';
  
  return { atrPercent, volatility };
}

async function analyzeHYPE(): Promise<AnalysisResult> {
  // Fetch 4h klines for better signal
  const klines = await fetchKlines('HYPEUSDT', '4h', 100);
  const prices = klines.map(k => k.close);
  const currentPrice = prices[prices.length - 1];
  
  // 24h change
  const price24hAgo = prices[Math.max(0, prices.length - 7)]; // 6 x 4h = 24h
  const change24h = ((currentPrice - price24hAgo) / price24hAgo) * 100;
  
  // Technical indicators
  const rsi = calculateRSI(prices);
  const ema7 = calculateEMA(prices, 7);
  const ema20 = calculateEMA(prices, 20);
  const ema50 = calculateEMA(prices, 50);
  
  // Trend
  let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (ema7 > ema20 && ema20 > ema50) trend = 'bullish';
  else if (ema7 < ema20 && ema20 < ema50) trend = 'bearish';
  
  // MACD
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  const macdHistory = [];
  for (let i = 26; i <= prices.length; i++) {
    const fast = calculateEMA(prices.slice(0, i), 12);
    const slow = calculateEMA(prices.slice(0, i), 26);
    macdHistory.push(fast - slow);
  }
  const signalLine = macdHistory.length >= 9 ? calculateEMA(macdHistory, 9) : macdLine;
  const macdHistogram = macdLine - signalLine;
  
  let macdCrossover: 'golden' | 'death' | 'none' = 'none';
  if (macdHistory.length >= 2) {
    const prevMACD = macdHistory[macdHistory.length - 2];
    const prevSignal = macdHistory.length >= 10 ? calculateEMA(macdHistory.slice(0, -1), 9) : prevMACD;
    if (prevMACD <= prevSignal && macdLine > signalLine) macdCrossover = 'golden';
    else if (prevMACD >= prevSignal && macdLine < signalLine) macdCrossover = 'death';
  }
  
  // Bollinger Bands
  const period = 20;
  const sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
  const variance = prices.slice(-period).reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
  const std = Math.sqrt(variance);
  const upper = sma + 2 * std;
  const lower = sma - 2 * std;
  const bollingerPercentB = ((currentPrice - lower) / (upper - lower)) * 100;
  
  // ATR
  const { atrPercent, volatility } = calculateATR(klines);
  
  // Signal score
  let signalScore = 0;
  const reasons: string[] = [];
  
  if (rsi < 30) { signalScore += 20; reasons.push(`RSI 과매도 (${rsi.toFixed(1)})`); }
  else if (rsi < 40) { signalScore += 10; reasons.push(`RSI 낮음 (${rsi.toFixed(1)})`); }
  else if (rsi > 70) { signalScore -= 20; reasons.push(`RSI 과매수 (${rsi.toFixed(1)})`); }
  else if (rsi > 60) { signalScore -= 10; reasons.push(`RSI 높음 (${rsi.toFixed(1)})`); }
  
  if (macdCrossover === 'golden') { signalScore += 25; reasons.push('MACD 골든크로스'); }
  else if (macdCrossover === 'death') { signalScore -= 25; reasons.push('MACD 데드크로스'); }
  else if (macdHistogram > 0) { signalScore += 10; reasons.push('MACD 상승세'); }
  else if (macdHistogram < 0) { signalScore -= 10; reasons.push('MACD 하락세'); }
  
  if (bollingerPercentB < 10) { signalScore += 20; reasons.push('볼린저 하단 터치'); }
  else if (bollingerPercentB < 25) { signalScore += 10; reasons.push('볼린저 하단 근접'); }
  else if (bollingerPercentB > 90) { signalScore -= 20; reasons.push('볼린저 상단 터치'); }
  else if (bollingerPercentB > 75) { signalScore -= 10; reasons.push('볼린저 상단 근접'); }
  
  // Signal action
  let signalAction = 'hold';
  if (signalScore >= 50) signalAction = 'strong_buy';
  else if (signalScore >= 25) signalAction = 'buy';
  else if (signalScore <= -50) signalAction = 'strong_sell';
  else if (signalScore <= -25) signalAction = 'sell';
  
  // Position sizing
  let basePosition = 50;
  if (signalAction === 'strong_buy') basePosition = 80 + (Math.abs(signalScore) - 50) * 0.4;
  else if (signalAction === 'buy') basePosition = 50 + (Math.abs(signalScore) - 25) * 1.2;
  else if (signalAction === 'sell') basePosition = Math.max(10, 30 - (Math.abs(signalScore) - 25) * 0.8);
  else if (signalAction === 'strong_sell') basePosition = Math.max(0, 10 - (Math.abs(signalScore) - 50) * 0.2);
  
  let volMultiplier = 1;
  let maxLeverage = 3;
  if (volatility === 'low') { volMultiplier = 1.2; maxLeverage = 5; }
  else if (volatility === 'high') { volMultiplier = 0.7; maxLeverage = 2; }
  else if (volatility === 'extreme') { volMultiplier = 0.5; maxLeverage = 1; }
  
  const positionSize = Math.min(100, Math.max(0, Math.round(basePosition * volMultiplier)));
  
  return {
    price: currentPrice,
    change24h,
    rsi,
    ema7,
    ema20,
    ema50,
    trend,
    macdCrossover,
    macdHistogram,
    bollingerPercentB,
    atrPercent,
    volatility: volatility as any,
    signalScore,
    signalAction,
    positionSize,
    maxLeverage,
    reasons,
  };
}

// Main
analyzeHYPE().then(result => {
  console.log(JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
