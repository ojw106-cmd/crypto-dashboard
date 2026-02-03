import { Kline } from '@/types/market';

export async function fetchKlines(
  symbol: string,
  interval: string,
  limit: number = 100
): Promise<Kline[]> {
  const response = await fetch(
    `/api/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch klines: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export async function fetchCurrentPrice(symbol: string): Promise<{
  price: number;
  priceChange: number;
  priceChangePercent: number;
}> {
  const response = await fetch(
    `/api/klines?symbol=${symbol}&interval=1d&limit=2`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch price: ${response.statusText}`);
  }

  const klines: Kline[] = await response.json();

  if (klines.length < 2) {
    const lastKline = klines[klines.length - 1];
    return {
      price: lastKline?.close ?? 0,
      priceChange: 0,
      priceChangePercent: 0,
    };
  }

  const currentPrice = klines[klines.length - 1].close;
  const previousClose = klines[klines.length - 2].close;
  const priceChange = currentPrice - previousClose;
  const priceChangePercent = (priceChange / previousClose) * 100;

  return {
    price: currentPrice,
    priceChange,
    priceChangePercent,
  };
}
