import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../../src/pages/DashboardPage';
import * as useNotesHook from '../../src/hooks/useNotes';

jest.mock('../../src/hooks/useNotes');
jest.mock('../../src/components/notes/NoteEditor', () => ({ content, onChange }) => (
  <textarea
    data-testid="mock-editor"
    value={content}
    onChange={(e) => onChange(e.target.value)}
  />
));

describe('DashboardPage Component (Dashboard, Note Creation & Deletion)', () => {
  const mockFetchNotes = jest.fn().mockResolvedValue([]);
  const mockCreateNote = jest.fn();
  const mockDeleteNote = jest.fn();
  const mockTogglePin = jest.fn();

  const sampleNotes = [
    {
      id: 1,
      title: 'Architecture Plan',
      content: '<p>System design notes</p>',
      is_pinned: 1,
      created_at: '2026-11-14T10:00:00Z',
      updated_at: '2026-11-14T10:00:00Z'
    },
    {
      id: 2,
      title: 'Grocery List',
      content: '<p>Milk and bread</p>',
      is_pinned: 0,
      created_at: '2026-11-14T11:00:00Z',
      updated_at: '2026-11-14T11:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupHook = (overrides = {}) => {
    jest.spyOn(useNotesHook, 'useNotes').mockReturnValue({
      notes: [],
      loading: false,
      error: null,
      fetchNotes: mockFetchNotes,
      createNote: mockCreateNote,
      deleteNote: mockDeleteNote,
      togglePin: mockTogglePin,
      ...overrides
    });
  };

  it('renders dashboard with empty state when there are no notes', () => {
    setupHook({ notes: [] });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText('My Notes')).toBeInTheDocument();
    expect(screen.getByText('No notes found')).toBeInTheDocument();
  });

  it('renders error banner when fetching notes fails', () => {
    setupHook({ error: 'Network Error: Unable to load notes' });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Network Error: Unable to load notes')).toBeInTheDocument();
  });

  it('renders note cards when notes exist', () => {
    setupHook({ notes: sampleNotes });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Architecture Plan')).toBeInTheDocument();
    expect(screen.getByText('Grocery List')).toBeInTheDocument();
  });

  it('opens create note modal and creates a new note successfully', async () => {
    mockCreateNote.mockResolvedValueOnce({
      id: 3,
      title: 'Sprint Retro',
      content: '<p>Action items</p>',
      is_pinned: 1
    });
    setupHook({ notes: sampleNotes });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText(/New Note/i));

    expect(screen.getByText('Create New Note')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Project Ideas/i), {
      target: { value: 'Sprint Retro' }
    });
    fireEvent.change(screen.getByTestId('mock-editor'), {
      target: { value: '<p>Action items</p>' }
    });
    fireEvent.click(screen.getByLabelText(/Pin this note to top/i));

    fireEvent.click(screen.getByRole('button', { name: /Save Note/i }));

    await waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalledWith({
        title: 'Sprint Retro',
        content: '<p>Action items</p>',
        is_pinned: 1
      });
      expect(mockFetchNotes).toHaveBeenCalled();
    });
  });

  it('displays validation error if note content is empty when creating note', async () => {
    setupHook({ notes: [] });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText(/New Note/i));

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Project Ideas/i), {
      target: { value: 'Only Title' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Note/i }));

    await waitFor(() => {
      expect(screen.getByText('Note content cannot be empty')).toBeInTheDocument();
      expect(mockCreateNote).not.toHaveBeenCalled();
    });
  });

  it('opens delete confirmation modal and deletes note upon confirmation', async () => {
    mockDeleteNote.mockResolvedValueOnce();
    setupHook({ notes: sampleNotes });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    const deleteButtons = screen.getAllByLabelText(/Delete note/i);
    fireEvent.click(deleteButtons[0]);

    expect(
      screen.getByText(/Are you sure you want to permanently delete this note\?/i)
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirm Delete/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteNote).toHaveBeenCalledWith(1);
      expect(mockFetchNotes).toHaveBeenCalled();
    });
  });
});
