import { NextRequest, NextResponse } from 'next/server';

const BINANCE_FUTURES_API = 'https://fapi.binance.com';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json(
      { error: 'Missing required parameter: symbol' },
      { status: 400 }
    );
  }

  try {
    // Use 24hr ticker for real-time price
    const url = `${BINANCE_FUTURES_API}/fapi/v1/ticker/24hr?symbol=${symbol}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // No caching for real-time price
    });

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      symbol: data.symbol,
      price: parseFloat(data.lastPrice),
      priceChange: parseFloat(data.priceChange),
      priceChangePercent: parseFloat(data.priceChangePercent),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      volume24h: parseFloat(data.volume),
    });
  } catch (error) {
    console.error('Error fetching ticker:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticker from Binance' },
      { status: 500 }
    );
  }
}
