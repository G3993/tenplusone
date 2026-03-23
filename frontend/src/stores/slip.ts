import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Bet {
  matchId: string;
  pick: 'home' | 'away' | 'draw';
  odds: number;
  homeTeam: string;
  awayTeam: string;
  wager: string; // Shopify product variant ID (e.g. gid://shopify/ProductVariant/...)
}

interface SlipStore {
  bets: Bet[];
  toggleBet: (bet: Omit<Bet, 'wager'>) => void;
  removeBet: (matchId: string) => void;
  setWager: (matchId: string, wager: string) => void;
  clear: () => void;
}

export const useSlipStore = create<SlipStore>()(
  persist(
    (set) => ({
      bets: [],
      toggleBet: (bet) =>
        set((s) => {
          const exists = s.bets.find(
            (b) => b.matchId === bet.matchId && b.pick === bet.pick
          );
          if (exists) {
            return {
              bets: s.bets.filter(
                (b) => !(b.matchId === bet.matchId && b.pick === bet.pick)
              ),
            };
          }
          return {
            bets: [
              ...s.bets.filter((b) => b.matchId !== bet.matchId),
              { ...bet, wager: '' },
            ],
          };
        }),
      removeBet: (matchId) =>
        set((s) => ({ bets: s.bets.filter((b) => b.matchId !== matchId) })),
      setWager: (matchId, wager) =>
        set((s) => ({
          bets: s.bets.map((b) =>
            b.matchId === matchId ? { ...b, wager } : b
          ),
        })),
      clear: () => set({ bets: [] }),
    }),
    { name: 'tenplusone-slip' }
  )
);
