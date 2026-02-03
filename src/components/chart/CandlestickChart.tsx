"use client";

import { useEffect, useRef } from "react";
import { createChart, IChartApi, CandlestickData, Time } from "lightweight-charts";
import { Kline, Level } from "@/types/market";

interface CandlestickChartProps {
  klines: Kline[];
  levels?: Level[];
  height?: number;
}

export function CandlestickChart({
  klines,
  levels = [],
  height = 200,
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      rightPriceScale: {
        borderColor: "#374151",
      },
      timeScale: {
        borderColor: "#374151",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      borderUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      wickUpColor: "#22c55e",
    });

    const chartData: CandlestickData<Time>[] = klines.map((k) => ({
      time: k.time as Time,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }));

    candlestickSeries.setData(chartData);

    // Add price lines for support/resistance levels
    levels.forEach((level) => {
      candlestickSeries.createPriceLine({
        price: level.price,
        color: level.type === "support" ? "#22c55e" : "#ef4444",
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: level.type === "support" ? "S" : "R",
      });
    });

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [klines, levels, height]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
}
