import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteCard from '../../src/components/notes/NoteCard';

describe('NoteCard Component', () => {
  const mockNote = {
    id: 1,
    title: 'Meeting Notes',
    content: '<p>Discussing the project roadmap and deadlines.</p>',
    category: 'Work',
    tags: 'roadmap, q4',
    is_pinned: 0,
    is_favorite: 0,
    created_at: '2026-11-13T10:00:00Z',
    updated_at: '2026-11-13T10:00:00Z'
  };

  it('renders note title, truncated text, category badge, and tags', () => {
    render(<NoteCard note={mockNote} />);
    expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
    expect(screen.getByText(/Discussing the project roadmap/i)).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('#roadmap')).toBeInTheDocument();
    expect(screen.getByText('#q4')).toBeInTheDocument();
  });

  it('indicates pin status visually when pinned', () => {
    const pinnedNote = { ...mockNote, is_pinned: 1 };
    render(<NoteCard note={pinnedNote} />);
    const pinBtn = screen.getByLabelText(/Unpin note/i);
    expect(pinBtn).toBeInTheDocument();
  });

  it('calls onPin handler when pin button is clicked', () => {
    const handlePin = jest.fn();
    render(<NoteCard note={mockNote} onPin={handlePin} />);
    const pinBtn = screen.getByLabelText(/Pin note/i);
    fireEvent.click(pinBtn);
    expect(handlePin).toHaveBeenCalledTimes(1);
    expect(handlePin).toHaveBeenCalledWith(1, false);
  });

  it('calls onFavorite handler when favorite button is clicked', () => {
    const handleFavorite = jest.fn();
    render(<NoteCard note={mockNote} onFavorite={handleFavorite} />);
    const favBtn = screen.getByLabelText(/Favorite note/i);
    fireEvent.click(favBtn);
    expect(handleFavorite).toHaveBeenCalledTimes(1);
    expect(handleFavorite).toHaveBeenCalledWith(1, false);
  });

  it('calls onDelete handler when delete button is clicked', () => {
    const handleDelete = jest.fn();
    render(<NoteCard note={mockNote} onDelete={handleDelete} />);
    const deleteBtn = screen.getByLabelText(/Delete note/i);
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledTimes(1);
    expect(handleDelete).toHaveBeenCalledWith(1);
  });

  it('calls onClick handler when card body is clicked', () => {
    const handleClick = jest.fn();
    render(<NoteCard note={mockNote} onClick={handleClick} />);
    const cardTitle = screen.getByText('Meeting Notes');
    fireEvent.click(cardTitle);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
