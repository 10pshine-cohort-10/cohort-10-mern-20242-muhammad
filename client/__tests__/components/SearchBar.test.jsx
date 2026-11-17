import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SearchBar from '../../src/components/notes/SearchBar';

describe('SearchBar Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders search input and filter controls', () => {
    render(<SearchBar onFilterChange={jest.fn()} />);
    expect(
      screen.getByPlaceholderText(/Search notes by title or content/i)
    ).toBeInTheDocument();
    expect(screen.getByText('All Notes')).toBeInTheDocument();
    expect(screen.getByText(/Pinned Only/i)).toBeInTheDocument();
    expect(screen.getByText(/Favorites/i)).toBeInTheDocument();
  });

  it('debounces search input and triggers filter update', () => {
    const handleFilterChange = jest.fn();
    render(<SearchBar onFilterChange={handleFilterChange} />);

    const input = screen.getByPlaceholderText(/Search notes by title or content/i);
    fireEvent.change(input, { target: { value: 'react' } });

    act(() => {
      jest.advanceTimersByTime(450);
    });

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'react'
      })
    );
  });

  it('clears search input when clear button is clicked', () => {
    const handleFilterChange = jest.fn();
    render(<SearchBar onFilterChange={handleFilterChange} />);

    const input = screen.getByPlaceholderText(/Search notes by title or content/i);
    fireEvent.change(input, { target: { value: 'query' } });

    const clearBtn = screen.getByLabelText(/Clear search/i);
    fireEvent.click(clearBtn);

    expect(input).toHaveValue('');
  });

  it('updates sort order when sort dropdown is changed (including creation date sort)', () => {
    const handleFilterChange = jest.fn();
    render(<SearchBar onFilterChange={handleFilterChange} />);

    const select = screen.getByDisplayValue('Newest First');
    fireEvent.change(select, { target: { value: 'created_desc' } });

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: 'created_desc'
      })
    );
  });

  it('toggles pinned and favorite filters when filter buttons are clicked', () => {
    const handleFilterChange = jest.fn();
    render(<SearchBar onFilterChange={handleFilterChange} />);

    const pinnedBtn = screen.getByText(/Pinned Only/i);
    fireEvent.click(pinnedBtn);

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        pinned: 'true'
      })
    );

    const favBtn = screen.getByText(/Favorites/i);
    fireEvent.click(favBtn);

    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        favorite: 'true'
      })
    );
  });
});
