import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DaisyTheme = 'light' | 'dark';

interface ThemeState {
  theme: DaisyTheme;
  setTheme: (theme: DaisyTheme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',

      setTheme: (theme: DaisyTheme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },

      toggleTheme: () => {
        const nextTheme: DaisyTheme = get().theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', nextTheme);
        set({ theme: nextTheme });
      },
    }),
    {
      name: 'daisy-theme',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          document.documentElement.setAttribute('data-theme', state.theme);
        }
      },
    }
  )
);
