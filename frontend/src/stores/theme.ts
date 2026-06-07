import { create } from 'zustand';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'ifc-theme';

function readInitial(): Theme {
  if (typeof document === 'undefined') return 'dark';
  // light only if the user has explicitly chosen it; dark is the default
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : (localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark');
}

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage may be unavailable */
  }
}

interface ThemeStore {
  theme: Theme;
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: readInitial(),
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    apply(next);
    set({ theme: next });
  },
}));
