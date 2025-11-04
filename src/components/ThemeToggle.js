// src/components/ThemeToggle.js
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700"
      aria-label="Toggle theme"
      title={theme === 'light' ? 'Attiva modalità scura' : 'Attiva modalità chiara'}
    >
      {theme === 'light' ? (
        <FaMoon className="text-gray-700" size={18} />
      ) : (
        <FaSun className="text-yellow-400" size={18} />
      )}
    </button>
  );
};

export default ThemeToggle;
