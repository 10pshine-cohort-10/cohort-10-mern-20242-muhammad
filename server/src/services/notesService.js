'use strict';

const notesModel = require('../models/notesModel');
const AppError = require('../utils/AppError');
const { sanitizePlainText, sanitizeRichContent } = require('../utils/sanitize');
const { emitNoteEvent } = require('../utils/realtime');

/**
 * Assert that the given note exists and belongs to the given user.
 * @param {object|null} note
 * @param {number} userId
 */
function assertOwnership(note, userId) {
  if (!note || note.user_id !== userId) {
    throw new AppError('Note not found', 404, 'NOTE_NOT_FOUND');
  }
}

/**
 * Normalize tags input (array or comma-separated string) into sanitized comma-separated string.
 * @param {string|string[]} tags
 * @returns {string}
 */
function normalizeTags(tags) {
  if (!tags) return '';
  const raw = Array.isArray(tags) ? tags.join(', ') : String(tags);
  return sanitizePlainText(raw).slice(0, 255);
}

/**
 * Create a sanitized note for a user and broadcast real-time event.
 * @param {number} userId
 * @param {{ title: string, content: string, category?: string, tags?: string|string[], is_pinned?: number, is_favorite?: number }} data
 */
async function createNote(userId, { title, content, category, tags, is_pinned, is_favorite }) {
  const cleanTitle = sanitizePlainText(title);
  if (!cleanTitle) {
    throw new AppError('Title is required and must contain readable text', 400, 'VALIDATION_ERROR');
  }
  const cleanContent = sanitizeRichContent(content);

  const createPayload = {
    user_id: userId,
    title: cleanTitle,
    content: cleanContent,
    is_pinned: is_pinned || 0,
  };

  if (category !== undefined) {
    createPayload.category = sanitizePlainText(category) || 'General';
  }
  if (tags !== undefined) {
    createPayload.tags = normalizeTags(tags);
  }
  if (is_favorite !== undefined) {
    createPayload.is_favorite = is_favorite ? 1 : 0;
  }

  const note = await notesModel.create(createPayload);
  emitNoteEvent(userId, 'note:created', { note });
  return note;
}

/**
 * List notes scoped strictly to userId with optional search/filter/sort.
 * @param {number} userId
 * @param {{ search?: string, pinned?: string, favorite?: string, category?: string, tag?: string, sort?: string }} filters
 */
async function getNotesByUser(userId, filters = {}) {
  return notesModel.findAllByUser(userId, filters);
}

/**
 * Paginate an array of notes and return both the slice and pagination metadata.
 * @param {Array} notes
 * @param {number|string} page
 * @param {number|string} limit
 */
function paginateNotes(notes, page, limit) {
  const list = Array.isArray(notes) ? notes : [];
  const total = list.length;

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = limit ? Math.max(1, Math.min(100, parseInt(limit, 10) || 10)) : total || 10;
  const totalPages = Math.max(1, Math.ceil(total / parsedLimit));
  const safePage = Math.min(parsedPage, totalPages);

  const startIndex = (safePage - 1) * parsedLimit;
  const items = limit ? list.slice(startIndex, startIndex + parsedLimit) : list;

  return {
    items,
    pagination: {
      page: safePage,
      limit: parsedLimit,
      total,
      totalPages,
    },
  };
}

/**
 * Retrieve a single note by id and verify ownership by userId.
 * @param {number} noteId
 * @param {number} userId
 */
async function getNoteById(noteId, userId) {
  const note = await notesModel.findById(noteId, userId);
  assertOwnership(note, userId);
  return note;
}

/**
 * Update a note after verifying ownership and sanitizing inputs.
 * @param {number} noteId
 * @param {number} userId
 * @param {{ title?: string, content?: string, category?: string, tags?: string|string[], is_pinned?: number, is_favorite?: number }} payload
 */
async function updateNote(noteId, userId, { title, content, category, tags, is_pinned, is_favorite }) {
  const note = await notesModel.findById(noteId, userId);
  assertOwnership(note, userId);

  const fields = {};

  if (title !== undefined) {
    const cleanTitle = sanitizePlainText(title);
    if (!cleanTitle) {
      throw new AppError('Title cannot be empty', 400, 'VALIDATION_ERROR');
    }
    fields.title = cleanTitle;
  }

  if (content !== undefined) {
    fields.content = sanitizeRichContent(content);
  }

  if (category !== undefined) {
    fields.category = sanitizePlainText(category) || 'General';
  }

  if (tags !== undefined) {
    fields.tags = normalizeTags(tags);
  }

  if (is_pinned !== undefined) {
    fields.is_pinned = is_pinned ? 1 : 0;
  }

  if (is_favorite !== undefined) {
    fields.is_favorite = is_favorite ? 1 : 0;
  }

  const updatedNote = await notesModel.update(noteId, userId, fields);
  emitNoteEvent(userId, 'note:updated', { note: updatedNote });
  return updatedNote;
}

/**
 * Delete a note after verifying ownership and broadcast real-time event.
 * @param {number} noteId
 * @param {number} userId
 */
async function deleteNote(noteId, userId) {
  const note = await notesModel.findById(noteId, userId);
  assertOwnership(note, userId);

  await notesModel.remove(noteId, userId);
  emitNoteEvent(userId, 'note:deleted', { noteId: Number(noteId) });
}

module.exports = {
  createNote,
  getNotesByUser,
  paginateNotes,
  getNoteById,
  updateNote,
  deleteNote,
};
