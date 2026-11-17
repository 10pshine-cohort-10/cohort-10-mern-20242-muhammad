import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../src/context/ThemeContext';
import ThemeToggle from '../../src/components/common/ThemeToggle';

describe('ThemeToggle & ThemeContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('toggles between light and dark theme and persists to localStorage', () => {
    render(
      <ThemeProvider initialTheme="light">
        <ThemeToggle showLabel />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByLabelText('Toggle color theme');
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(toggleBtn);

    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(window.localStorage.getItem('inkwell-theme')).toBe('dark');

    fireEvent.click(toggleBtn);

    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(window.localStorage.getItem('inkwell-theme')).toBe('light');
  });
});
