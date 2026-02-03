"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceHeader } from "./PriceHeader";
import { AnalysisSummary } from "./AnalysisSummary";
import { useKlines } from "@/hooks/useKlines";
import { CoinSymbol, COIN_DISPLAY_NAMES, TimeFrame } from "@/types/market";

const CandlestickChart = dynamic(
  () => import("@/components/chart/CandlestickChart").then((mod) => mod.CandlestickChart),
  {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-muted animate-pulse rounded" />
  }
);

interface CoinCardProps {
  symbol: CoinSymbol;
  timeFrame: TimeFrame;
}

export function CoinCard({ symbol, timeFrame }: CoinCardProps) {
  const { 
    klines, 
    analysis, 
    levels, 
    macd, 
    bollinger, 
    volume, 
    tradingSignal,
    atr,
    positionSizing,
    currentPrice, 
    priceChange24h, 
    isLoading, 
    isError 
  } = useKlines(symbol, timeFrame);

  if (isError) {
    return (
      <Card className="bg-card">
        <CardHeader>
          <h3 className="text-lg font-semibold">{COIN_DISPLAY_NAMES[symbol]}</h3>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Failed to load data</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-card">
        <CardHeader>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-48 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-[400px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card">
      <CardHeader className="pb-4">
        <PriceHeader
          symbol={COIN_DISPLAY_NAMES[symbol]}
          price={currentPrice}
          priceChange={priceChange24h}
        />
      </CardHeader>
      <CardContent className="space-y-6">
        <CandlestickChart klines={klines} levels={levels.slice(0, 6)} height={400} />
        <AnalysisSummary
          analysis={analysis}
          levels={levels}
          currentPrice={currentPrice}
          macd={macd}
          bollinger={bollinger}
          volume={volume}
          tradingSignal={tradingSignal}
          atr={atr}
          positionSizing={positionSizing}
        />
      </CardContent>
    </Card>
  );
}
