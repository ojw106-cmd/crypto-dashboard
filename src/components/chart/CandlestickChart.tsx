"use client";

import { useEffect, useRef, useMemo } from "react";
import { createChart, IChartApi, CandlestickData, Time, LineData } from "lightweight-charts";
import { Kline, Level, BollingerBands } from "@/types/market";

interface CandlestickChartProps {
  klines: Kline[];
  levels?: Level[];
  height?: number;
  showBollingerBands?: boolean;
}

// Calculate Bollinger Bands for each candle
function calculateBollingerBandsHistory(klines: Kline[], period = 20, stdDev = 2) {
  const result: { time: number; upper: number; middle: number; lower: number }[] = [];
  
  for (let i = period - 1; i < klines.length; i++) {
    const slice = klines.slice(i - period + 1, i + 1);
    const closes = slice.map(k => k.close);
    const middle = closes.reduce((sum, p) => sum + p, 0) / period;
    
    const squaredDiffs = closes.map(p => Math.pow(p - middle, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / period;
    const std = Math.sqrt(variance);
    
    result.push({
      time: klines[i].time,
      upper: middle + stdDev * std,
      middle: middle,
      lower: middle - stdDev * std,
    });
  }
  
  return result;
}

export function CandlestickChart({
  klines,
  levels = [],
  height = 200,
  showBollingerBands = true,
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Calculate Bollinger Bands
  const bollingerData = useMemo(() => {
    if (!showBollingerBands || klines.length < 20) return null;
    return calculateBollingerBandsHistory(klines);
  }, [klines, showBollingerBands]);

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

    // Add Bollinger Bands first (so they appear behind candles)
    if (bollingerData && bollingerData.length > 0) {
      // Upper band - Orange/Yellow for visibility
      const upperBandSeries = chart.addLineSeries({
        color: "#f59e0b", // Amber/Orange
        lineWidth: 2,
        lineStyle: 0,
        priceLineVisible: false,
        lastValueVisible: true,
        title: "BB Upper",
      });
      upperBandSeries.setData(
        bollingerData.map(b => ({ time: b.time as Time, value: b.upper }))
      );

      // Middle band (SMA) - White dashed
      const middleBandSeries = chart.addLineSeries({
        color: "#ffffff", // White
        lineWidth: 1,
        lineStyle: 2, // Dashed
        priceLineVisible: false,
        lastValueVisible: false,
        title: "BB Mid",
      });
      middleBandSeries.setData(
        bollingerData.map(b => ({ time: b.time as Time, value: b.middle }))
      );

      // Lower band - Orange/Yellow for visibility
      const lowerBandSeries = chart.addLineSeries({
        color: "#f59e0b", // Amber/Orange
        lineWidth: 2,
        lineStyle: 0,
        priceLineVisible: false,
        lastValueVisible: true,
        title: "BB Lower",
      });
      lowerBandSeries.setData(
        bollingerData.map(b => ({ time: b.time as Time, value: b.lower }))
      );
    }

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
  }, [klines, levels, height, bollingerData]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
}
