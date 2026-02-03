export interface Kline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalAnalysis {
  ema7: number;
  ema20: number;
  ema50: number;
  rsi: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export interface Level {
  price: number;
  type: 'support' | 'resistance';
  strength: number;
}

export interface MACD {
  macd: number;
  signal: number;
  histogram: number;
  crossover: 'golden' | 'death' | 'none';
}

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number; // 0-100, current price position within bands
}

export interface VolumeAnalysis {
  currentVolume: number;
  avgVolume: number;
  volumeRatio: number;
  trend: 'high' | 'low' | 'normal';
}

export interface TradingSignal {
  action: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: 'high' | 'medium' | 'low';
  score: number; // -100 to +100
  reasons: string[];
  timestamp: number;
}

export interface ATRData {
  atr: number;
  atrPercent: number; // ATR as % of current price
  volatility: 'low' | 'medium' | 'high' | 'extreme';
}

export interface PositionSizing {
  basePosition: number;      // Signal score based (0-100%)
  volatilityAdjusted: number; // After ATR adjustment (0-100%)
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  maxLeverage: number;       // Suggested max leverage based on volatility
  reasoning: string[];
}

export interface CoinData {
  symbol: string;
  displayName: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  klines: Kline[];
  analysis: TechnicalAnalysis;
  levels: Level[];
}

export type TimeFrame = '3m' | '15m' | '1h' | '4h' | '1d';

export const COINS = ['BTCUSDT', 'ETHUSDT', 'HYPEUSDT'] as const;
export type CoinSymbol = typeof COINS[number];

export const COIN_DISPLAY_NAMES: Record<CoinSymbol, string> = {
  BTCUSDT: 'BTC/USDT',
  ETHUSDT: 'ETH/USDT',
  HYPEUSDT: 'HYPE/USDT',
};

export const TIME_FRAMES: TimeFrame[] = ['3m', '15m', '1h', '4h', '1d'];

// Technical indicators for detailed analysis
export interface TechnicalIndicators {
  ema: {
    ema7: number;
    ema20: number;
    ema50: number;
    trend: 'bullish' | 'bearish' | 'neutral';
  };
  rsi: {
    value: number;
    condition: 'oversold' | 'overbought' | 'neutral';
  };
  macd: {
    macd: number;
    signal: number;
    histogram: number;
    trend: 'bullish' | 'bearish' | 'neutral';
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    position: 'upper' | 'middle' | 'lower';
  };
  support: Array<{ price: number; strength: number }>;
  resistance: Array<{ price: number; strength: number }>;
  signalScore: number; // -100 to +100
}
