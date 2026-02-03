import { create } from 'zustand';
import { TimeFrame, CoinSymbol } from '@/types/market';

interface AppState {
  selectedTimeFrame: TimeFrame;
  selectedCoin: CoinSymbol | null;
  setTimeFrame: (timeFrame: TimeFrame) => void;
  setSelectedCoin: (coin: CoinSymbol | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedTimeFrame: '1h',
  selectedCoin: null,
  setTimeFrame: (timeFrame) => set({ selectedTimeFrame: timeFrame }),
  setSelectedCoin: (coin) => set({ selectedCoin: coin }),
}));
