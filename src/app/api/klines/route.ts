import { NextRequest, NextResponse } from 'next/server';

const BINANCE_FUTURES_API = 'https://fapi.binance.com';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval');
  const limit = searchParams.get('limit') || '100';

  if (!symbol || !interval) {
    return NextResponse.json(
      { error: 'Missing required parameters: symbol and interval' },
      { status: 400 }
    );
  }

  try {
    const url = `${BINANCE_FUTURES_API}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform Binance kline data to our format
    // Binance format: [openTime, open, high, low, close, volume, closeTime, ...]
    const klines = data.map((k: (string | number)[]) => ({
      time: Math.floor(Number(k[0]) / 1000), // Convert to seconds for lightweight-charts
      open: parseFloat(k[1] as string),
      high: parseFloat(k[2] as string),
      low: parseFloat(k[3] as string),
      close: parseFloat(k[4] as string),
      volume: parseFloat(k[5] as string),
    }));

    return NextResponse.json(klines);
  } catch (error) {
    console.error('Error fetching klines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch klines from Binance' },
      { status: 500 }
    );
  }
}
