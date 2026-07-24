import { create } from 'zustand';
import { api } from '@/lib/api';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'em_theme';

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

interface ThemeState {
  theme: Theme;
  /** Sets the theme locally + persists it; pass sync: false to skip the backend PUT (e.g. right after login, when the value already came from the server). */
  setTheme: (theme: Theme, opts?: { sync?: boolean }) => void;
  toggleTheme: () => void;
}

const initialTheme: Theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme,

  setTheme: (theme, opts = {}) => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    set({ theme });
    if (opts.sync !== false) {
      api.put('/auth.php?action=theme', { theme }).catch(() => {});
    }
  },

  toggleTheme: () => {
    get().setTheme(get().theme === 'dark' ? 'light' : 'dark');
  },
}));
