'use client';

import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-9 h-9 rounded-xl
                 bg-gray-200 dark:bg-white/10 backdrop-blur-sm
                 border border-gray-300 dark:border-white/20
                 text-gray-700 dark:text-gray-200
                 transition-all duration-300 hover:scale-105 active:scale-95
                 hover:bg-gray-300 dark:hover:bg-white/20"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
