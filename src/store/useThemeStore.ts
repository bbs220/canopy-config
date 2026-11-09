import { create } from 'zustand';

export type DaisyTheme = 'light' | 'dark';

interface ThemeState {
  theme: DaisyTheme;
  setTheme: (theme: DaisyTheme) => void;
  toggleTheme: () => void;
}

const getInitialTheme = (): DaisyTheme => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('daisy-theme') as DaisyTheme;
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
      return saved;
    }
    document.documentElement.setAttribute('data-theme', 'light');
  }
  return 'light';
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),

  setTheme: (theme: DaisyTheme) => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('daisy-theme', theme);
    }
    set({ theme });
  },

  toggleTheme: () => {
    const nextTheme: DaisyTheme = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(nextTheme);
  },
}));
