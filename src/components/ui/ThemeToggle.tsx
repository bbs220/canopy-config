import React from 'react';
import { useThemeStore } from '../../store/useThemeStore';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost btn-sm gap-2"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <>
          <Moon className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold">Dark</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-warning" />
          <span className="text-xs font-semibold">Light</span>
        </>
      )}
    </button>
  );
};
