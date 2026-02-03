import { useQuery } from '@tanstack/react-query';
import { fetchKlines } from '@/lib/binance';
import { calculateTechnicalAnalysis } from '@/lib/indicators';
import { findSupportResistance } from '@/lib/levels';
import { Kline, TimeFrame, CoinSymbol, TechnicalAnalysis, Level } from '@/types/market';

interface UseKlinesResult {
  klines: Kline[];
  analysis: TechnicalAnalysis;
  levels: Level[];
  currentPrice: number;
  priceChange24h: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

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
  const analysis = klines.length > 0
    ? calculateTechnicalAnalysis(klines)
    : { ema7: 0, ema20: 0, ema50: 0, rsi: 50, trend: 'neutral' as const };
  const levels = klines.length > 0 ? findSupportResistance(klines) : [];

  const currentPrice = klines.length > 0 ? klines[klines.length - 1].close : 0;

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
    currentPrice,
    priceChange24h,
    isLoading,
    isError,
    error: error as Error | null,
  };
}
