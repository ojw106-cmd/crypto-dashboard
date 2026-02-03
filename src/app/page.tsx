"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoinCard } from "@/components/dashboard/CoinCard";
import { useAppStore } from "@/store/useAppStore";
import { TIME_FRAMES, TimeFrame, CoinSymbol } from "@/types/market";

const DISPLAY_ORDER: CoinSymbol[] = ['HYPEUSDT', 'BTCUSDT', 'ETHUSDT'];

export default function Home() {
  const { selectedTimeFrame, setTimeFrame } = useAppStore();

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sticky top-0 bg-background/95 backdrop-blur py-4 z-10">
          <h1 className="text-2xl font-bold">Crypto Dashboard</h1>
          <Tabs
            value={selectedTimeFrame}
            onValueChange={(v) => setTimeFrame(v as TimeFrame)}
          >
            <TabsList>
              {TIME_FRAMES.map((tf) => (
                <TabsTrigger key={tf} value={tf}>
                  {tf}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </header>

        <div className="flex flex-col gap-8">
          {DISPLAY_ORDER.map((coin) => (
            <CoinCard key={coin} symbol={coin} timeFrame={selectedTimeFrame} />
          ))}
        </div>

        <footer className="mt-8 text-center text-sm text-muted-foreground">
          Data from Binance Futures API. Auto-refreshes every 5 minutes.
        </footer>
      </div>
    </main>
  );
}
