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
