import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import NoteDetailPage from '../../src/pages/NoteDetailPage';
import * as notesService from '../../src/services/notesService';

jest.mock('../../src/services/notesService');
jest.mock('../../src/components/notes/NoteEditor', () => ({ content, onChange }) => (
  <textarea
    data-testid="mock-detail-editor"
    value={content}
    onChange={(e) => onChange(e.target.value)}
  />
));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('NoteDetailPage Component (Note Editing & Deletion)', () => {
  const existingNote = {
    id: 42,
    title: 'Initial Title',
    content: '<p>Initial body content</p>',
    is_pinned: 0,
    created_at: '2026-11-14T10:00:00Z',
    updated_at: '2026-11-14T10:30:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderNoteDetail = () =>
    render(
      <MemoryRouter initialEntries={['/notes/42']}>
        <Routes>
          <Route path="/notes/:id" element={<NoteDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

  it('loads and displays existing note for editing', async () => {
    notesService.getNoteById.mockResolvedValueOnce({
      data: { data: { note: existingNote } }
    });

    renderNoteDetail();

    await waitFor(() => {
      expect(notesService.getNoteById).toHaveBeenCalledWith('42');
      expect(screen.getByDisplayValue('Initial Title')).toBeInTheDocument();
      expect(screen.getByTestId('mock-detail-editor')).toHaveValue('<p>Initial body content</p>');
    });
  });

  it('updates note title and content and shows success message on save', async () => {
    notesService.getNoteById.mockResolvedValueOnce({
      data: { data: { note: existingNote } }
    });
    notesService.updateNote.mockResolvedValueOnce({
      data: {
        data: {
          note: {
            ...existingNote,
            title: 'Updated Note Title',
            content: '<p>Updated content</p>',
            is_pinned: 1,
            updated_at: '2026-11-14T12:00:00Z'
          }
        }
      }
    });

    renderNoteDetail();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Initial Title')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue('Initial Title'), {
      target: { value: 'Updated Note Title' }
    });
    fireEvent.change(screen.getByTestId('mock-detail-editor'), {
      target: { value: '<p>Updated content</p>' }
    });
    fireEvent.click(screen.getByLabelText(/Pinned to top/i));

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(notesService.updateNote).toHaveBeenCalledWith('42', {
        title: 'Updated Note Title',
        content: '<p>Updated content</p>',
        is_pinned: 1
      });
      expect(screen.getByText('Note saved successfully!')).toBeInTheDocument();
    });
  });

  it('displays error message when saving edited note fails', async () => {
    notesService.getNoteById.mockResolvedValueOnce({
      data: { data: { note: existingNote } }
    });
    notesService.updateNote.mockRejectedValueOnce({
      response: { data: { message: 'Failed to update note on server' } }
    });

    renderNoteDetail();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Initial Title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to update note on server')).toBeInTheDocument();
    });
  });

  it('opens confirmation dialog and deletes note when Confirm Delete is clicked', async () => {
    notesService.getNoteById.mockResolvedValueOnce({
      data: { data: { note: existingNote } }
    });
    notesService.deleteNote.mockResolvedValueOnce({
      data: { success: true }
    });

    renderNoteDetail();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Initial Title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Delete$/i }));

    expect(
      screen.getByText(/Are you sure you want to permanently delete this note\?/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Confirm Delete/i }));

    await waitFor(() => {
      expect(notesService.deleteNote).toHaveBeenCalledWith('42');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
