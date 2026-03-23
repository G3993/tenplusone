import { create } from 'zustand';

interface MatchesStore {
  groupFilter: string;
  setGroupFilter: (group: string) => void;
}

export const useMatchesStore = create<MatchesStore>((set) => ({
  groupFilter: 'all',
  setGroupFilter: (group) => set({ groupFilter: group }),
}));
