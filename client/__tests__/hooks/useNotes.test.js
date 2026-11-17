import { renderHook, act } from '@testing-library/react';
import { useNotes } from '../../src/hooks/useNotes';
import * as notesService from '../../src/services/notesService';

jest.mock('../../src/services/notesService');

describe('useNotes hook', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches notes and updates state', async () => {
    const mockNotes = [
      { id: 1, title: 'Note 1', content: 'Content 1', is_pinned: 0 }
    ];
    notesService.getNotes.mockResolvedValueOnce({
      data: { data: { notes: mockNotes } }
    });

    const { result } = renderHook(() => useNotes());

    await act(async () => {
      await result.current.fetchNotes();
    });

    expect(result.current.notes).toEqual(mockNotes);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles note creation', async () => {
    const newNote = { id: 2, title: 'Note 2', content: 'Content 2' };
    notesService.createNote.mockResolvedValueOnce({
      data: { data: { note: newNote } }
    });

    const { result } = renderHook(() => useNotes());

    let created;
    await act(async () => {
      created = await result.current.createNote({ title: 'Note 2', content: 'Content 2' });
    });

    expect(created).toEqual(newNote);
    expect(notesService.createNote).toHaveBeenCalledWith({
      title: 'Note 2',
      content: 'Content 2'
    });
  });

  it('handles note deletion', async () => {
    notesService.deleteNote.mockResolvedValueOnce({
      data: { success: true }
    });

    const { result } = renderHook(() => useNotes());

    await act(async () => {
      await result.current.deleteNote(1);
    });

    expect(notesService.deleteNote).toHaveBeenCalledWith(1);
  });
});

