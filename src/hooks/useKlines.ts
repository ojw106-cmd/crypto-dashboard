import { useQuery } from '@tanstack/react-query';
import { fetchKlines } from '@/lib/binance';
import { 
  calculateTechnicalAnalysis, 
  calculateMACD, 
  calculateBollingerBands, 
  analyzeVolume,
  calculateFibonacciLevels,
  generateTradingSignal 
} from '@/lib/indicators';
import { findSupportResistance } from '@/lib/levels';
import { 
  Kline, TimeFrame, CoinSymbol, TechnicalAnalysis, Level, 
  MACD, BollingerBands, VolumeAnalysis, TradingSignal 
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

export function useKlines(
  symbol: CoinSymbol,
  timeFrame: TimeFrame
): UseKlinesResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['klines', symbol, timeFrame],
    queryFn: () => fetchKlines(symbol, timeFrame, 100),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 3,
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

  const currentPrice = klines.length > 0 ? klines[klines.length - 1].close : 0;

  // Generate trading signal
  const supportLevels = levels.filter(l => l.type === 'support').map(l => l.price);
  const resistanceLevels = levels.filter(l => l.type === 'resistance').map(l => l.price);
  
  const tradingSignal = klines.length > 0 
    ? generateTradingSignal(analysis, macd, bollinger, volume, currentPrice, supportLevels, resistanceLevels)
    : defaultSignal;

  // Calculate 24h price change from klines
  let priceChange24h = 0;
  if (klines.length >= 2) {
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
    currentPrice,
    priceChange24h,
    isLoading,
    isError,
    error: error as Error | null,
  };
}
