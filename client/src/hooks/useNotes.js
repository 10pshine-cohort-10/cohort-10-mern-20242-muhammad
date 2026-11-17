import { useState, useCallback } from 'react';
import * as notesService from '../services/notesService';

export const useNotes = () => {
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotes = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await notesService.getNotes(params);
      const data = response?.data?.data?.notes || [];
      if (response?.data?.data?.pagination) {
        setPagination(response.data.data.pagination);
      }
      setNotes(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch notes';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createNote = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await notesService.createNote(data);
      return response?.data?.data?.note;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create note';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateNote = async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await notesService.updateNote(id, data);
      return response?.data?.data?.note;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update note';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await notesService.deleteNote(id);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete note';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const togglePin = async (id, currentPinStatus) => {
    return updateNote(id, { is_pinned: currentPinStatus ? 0 : 1 });
  };

  const toggleFavorite = async (id, currentFavoriteStatus) => {
    return updateNote(id, { is_favorite: currentFavoriteStatus ? 0 : 1 });
  };

  const importNoteFile = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await notesService.importNote(payload);
      return response?.data?.data?.note;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to import note';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    notes,
    setNotes,
    pagination,
    loading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleFavorite,
    importNoteFile,
  };
};
