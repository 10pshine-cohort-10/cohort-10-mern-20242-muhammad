import api from './api';

export const getNotes = (params) => api.get('/notes', { params });
export const getNoteById = (id) => api.get(`/notes/${id}`);
export const createNote = (data) => api.post('/notes', data);
export const updateNote = (id, data) => api.put(`/notes/${id}`, data);
export const deleteNote = (id) => api.delete(`/notes/${id}`);
export const exportNote = (id, format = 'txt') =>
  api.get(`/notes/${id}/export`, { params: { format }, responseType: 'blob' });
export const importNote = (data) => api.post('/notes/import', data);
