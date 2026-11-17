import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CommandPalette from '../../src/components/common/CommandPalette';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { AuthProvider } from '../../src/context/AuthContext';

const renderPalette = (props = {}) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CommandPalette isOpen={true} onClose={jest.fn()} {...props} />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('CommandPalette Component', () => {
  it('renders command palette when isOpen is true', () => {
    renderPalette();
    expect(screen.getByPlaceholderText(/Type a command or search notes\.\.\./i)).toBeInTheDocument();
    expect(screen.getByText('New note')).toBeInTheDocument();
    expect(screen.getByText('Go to Profile Settings')).toBeInTheDocument();
  });

  it('filters actions when query is typed', () => {
    renderPalette();
    const input = screen.getByPlaceholderText(/Type a command or search notes\.\.\./i);
    fireEvent.change(input, { target: { value: 'theme' } });

    expect(screen.getByText(/Toggle color theme/i)).toBeInTheDocument();
    expect(screen.queryByText('New note')).not.toBeInTheDocument();
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = jest.fn();
    renderPalette({ onClose: handleClose });

    const dialog = screen.getByRole('dialog', { name: /Command palette/i });
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

    expect(handleClose).toHaveBeenCalled();
  });
});
