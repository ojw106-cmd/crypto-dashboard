import { Kline, Level } from '@/types/market';

interface PivotPoint {
  price: number;
  index: number;
  type: 'high' | 'low';
}

function findPivotPoints(klines: Kline[], lookback: number = 5): PivotPoint[] {
  const pivots: PivotPoint[] = [];

  for (let i = lookback; i < klines.length - lookback; i++) {
    const current = klines[i];
    let isHighPivot = true;
    let isLowPivot = true;

    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue;
      if (klines[j].high >= current.high) isHighPivot = false;
      if (klines[j].low <= current.low) isLowPivot = false;
    }

    if (isHighPivot) {
      pivots.push({ price: current.high, index: i, type: 'high' });
    }
    if (isLowPivot) {
      pivots.push({ price: current.low, index: i, type: 'low' });
    }
  }

  return pivots;
}

function clusterLevels(
  pivots: PivotPoint[],
  currentPrice: number,
  tolerance: number = 0.02
): Level[] {
  const levels: Level[] = [];
  const used = new Set<number>();

  for (let i = 0; i < pivots.length; i++) {
    if (used.has(i)) continue;

    const cluster: PivotPoint[] = [pivots[i]];
    used.add(i);

    for (let j = i + 1; j < pivots.length; j++) {
      if (used.has(j)) continue;

      const priceDiff =
        Math.abs(pivots[i].price - pivots[j].price) / pivots[i].price;
      if (priceDiff <= tolerance) {
        cluster.push(pivots[j]);
        used.add(j);
      }
    }

    const avgPrice =
      cluster.reduce((sum, p) => sum + p.price, 0) / cluster.length;
    const type = avgPrice > currentPrice ? 'resistance' : 'support';
    const strength = Math.min(cluster.length / 3, 1);

    levels.push({
      price: avgPrice,
      type,
      strength,
    });
  }

  return levels;
}

export function findSupportResistance(klines: Kline[]): Level[] {
  if (klines.length < 20) return [];

  const currentPrice = klines[klines.length - 1].close;
  const pivots = findPivotPoints(klines, 3);
  const allLevels = clusterLevels(pivots, currentPrice, 0.015);

  // Sort and filter to get the most relevant levels
  const supports = allLevels
    .filter((l) => l.type === 'support')
    .sort((a, b) => b.price - a.price)
    .slice(0, 3);

  const resistances = allLevels
    .filter((l) => l.type === 'resistance')
    .sort((a, b) => a.price - b.price)
    .slice(0, 3);

  return [...resistances, ...supports].sort((a, b) => b.price - a.price);
}
