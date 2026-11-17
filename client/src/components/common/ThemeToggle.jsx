import React from 'react';
import PropTypes from 'prop-types';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      aria-pressed={isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-subtle bg-surface text-primary hover:border-accent transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent ${className}`}
    >
      {isDark ? (
        <Moon size={16} strokeWidth={1.75} className="text-accent" aria-hidden="true" />
      ) : (
        <Sun size={16} strokeWidth={1.75} className="text-accent" aria-hidden="true" />
      )}
      {showLabel && (
        <span className="text-xs font-medium text-primary">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
};

ThemeToggle.propTypes = {
  className: PropTypes.string,
  showLabel: PropTypes.bool,
};

export default ThemeToggle;
