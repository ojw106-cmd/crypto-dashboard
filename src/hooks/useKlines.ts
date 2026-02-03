import { useQuery } from '@tanstack/react-query';
import { fetchKlines } from '@/lib/binance';
import { 
  calculateTechnicalAnalysis, 
  calculateMACD, 
  calculateBollingerBands, 
  analyzeVolume,
  calculateFibonacciLevels,
  generateTradingSignal,
  calculateATR,
  calculatePositionSizing
} from '@/lib/indicators';
import { findSupportResistance } from '@/lib/levels';
import { 
  Kline, TimeFrame, CoinSymbol, TechnicalAnalysis, Level, 
  MACD, BollingerBands, VolumeAnalysis, TradingSignal,
  ATRData, PositionSizing
} from '@/types/market';

interface UseKlinesResult {
  klines: Kline[];
  analysis: TechnicalAnalysis;
  levels: Level[];
  macd: MACD;
  bollinger: BollingerBands;
  volume: VolumeAnalysis;
  fibonacci: { price: number; level: string }[];
  tradingSignal: TradingSignal;
  atr: ATRData;
  positionSizing: PositionSizing;
  currentPrice: number;
  priceChange24h: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

const defaultMACD: MACD = { macd: 0, signal: 0, histogram: 0, crossover: 'none' };
const defaultBollinger: BollingerBands = { upper: 0, middle: 0, lower: 0, bandwidth: 0, percentB: 50 };
const defaultVolume: VolumeAnalysis = { currentVolume: 0, avgVolume: 0, volumeRatio: 1, trend: 'normal' };
const defaultSignal: TradingSignal = { action: 'hold', confidence: 'low', score: 0, reasons: [], timestamp: 0 };
const defaultATR: ATRData = { atr: 0, atrPercent: 0, volatility: 'medium' };
const defaultPositionSizing: PositionSizing = { 
  basePosition: 50, 
  volatilityAdjusted: 50, 
  riskLevel: 'moderate', 
  maxLeverage: 3, 
  reasoning: [] 
};

// Fetch real-time ticker
async function fetchTicker(symbol: string) {
  const response = await fetch(`/api/ticker?symbol=${symbol}`);
  if (!response.ok) throw new Error('Failed to fetch ticker');
  return response.json();
}

export function useKlines(
  symbol: CoinSymbol,
  timeFrame: TimeFrame
): UseKlinesResult {
  // Klines data - refresh every 2 minutes
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['klines', symbol, timeFrame],
    queryFn: () => fetchKlines(symbol, timeFrame, 100),
    refetchInterval: 2 * 60 * 1000, // 2 minutes
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
  });

  // Real-time ticker - refresh every 30 seconds
  const { data: tickerData } = useQuery({
    queryKey: ['ticker', symbol],
    queryFn: () => fetchTicker(symbol),
    refetchInterval: 30 * 1000, // 30 seconds
    staleTime: 10 * 1000, // 10 seconds
    retry: 2,
  });

  const klines = data ?? [];
  const closePrices = klines.map(k => k.close);
  
  const analysis = klines.length > 0
    ? calculateTechnicalAnalysis(klines)
    : { ema7: 0, ema20: 0, ema50: 0, rsi: 50, trend: 'neutral' as const };
  
  const levels = klines.length > 0 ? findSupportResistance(klines) : [];
  
  // New indicators
  const macd = klines.length > 0 ? calculateMACD(closePrices) : defaultMACD;
  const bollinger = klines.length > 0 ? calculateBollingerBands(closePrices) : defaultBollinger;
  const volume = klines.length > 0 ? analyzeVolume(klines) : defaultVolume;
  const fibonacci = klines.length > 0 ? calculateFibonacciLevels(klines) : [];

  // Use ticker price if available (more real-time), otherwise fall back to klines
  const currentPrice = tickerData?.price ?? (klines.length > 0 ? klines[klines.length - 1].close : 0);

  // Generate trading signal
  const supportLevels = levels.filter(l => l.type === 'support').map(l => l.price);
  const resistanceLevels = levels.filter(l => l.type === 'resistance').map(l => l.price);
  
  const tradingSignal = klines.length > 0 
    ? generateTradingSignal(analysis, macd, bollinger, volume, currentPrice, supportLevels, resistanceLevels)
    : defaultSignal;

  // Calculate ATR and position sizing
  const atr = klines.length > 0 ? calculateATR(klines) : defaultATR;
  const positionSizing = klines.length > 0 
    ? calculatePositionSizing(tradingSignal, atr) 
    : defaultPositionSizing;

  // Use ticker's 24h change if available (more accurate), otherwise calculate from klines
  let priceChange24h = tickerData?.priceChangePercent ?? 0;
  if (!tickerData && klines.length >= 2) {
    const periodsFor24h = timeFrame === '15m' ? 96 : timeFrame === '1h' ? 24 : timeFrame === '4h' ? 6 : 1;
    const startIndex = Math.max(0, klines.length - periodsFor24h - 1);
    const startPrice = klines[startIndex].close;
    priceChange24h = ((currentPrice - startPrice) / startPrice) * 100;
  }

  return {
    klines,
    analysis,
    levels,
    macd,
    bollinger,
    volume,
    fibonacci,
    tradingSignal,
    atr,
    positionSizing,
    currentPrice,
    priceChange24h,
    isLoading,
    isError,
    error: error as Error | null,
  };
}
