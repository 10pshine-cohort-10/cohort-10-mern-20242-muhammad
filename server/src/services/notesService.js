'use strict';

const notesModel = require('../models/notesModel');
const { sanitizePlainText, sanitizeRichContent } = require('../utils/sanitize');

/**
 * @typedef {Object} NotePayload
 * @property {string} title
 * @property {string} [content]
 * @property {string} [category]
 * @property {string|string[]} [tags]
 * @property {number|boolean} [is_pinned]
 * @property {number|boolean} [is_favorite]
 */

/**
 * @typedef {Object} NoteFilters
 * @property {string} [search]
 * @property {string} [pinned]
 * @property {string} [favorite]
 * @property {string} [category]
 * @property {string} [tag]
 * @property {string} [sort]
 */

/**
 * Asserts note exists and belongs to user.
 * @param {object|null} note
 * @param {number} userId
 * @throws {Error} NOTE_NOT_FOUND
 */
function assertOwnership(note, userId) {
  if (!note || note.user_id !== userId) {
    const error = new Error('Note not found');
    /** @type {any} */ (error).statusCode = 404;
    /** @type {any} */ (error).code = 'NOTE_NOT_FOUND';
    /** @type {any} */ (error).isOperational = true;
    throw error;
  }
}

/**
 * Normalizes tags input into comma-separated string.
 * @param {string|string[]} tags
 * @returns {string}
 */
function normalizeTags(tags) {
  if (!tags) return '';
  const raw = Array.isArray(tags) ? tags.join(', ') : String(tags);
  return sanitizePlainText(raw).slice(0, 255);
}

/**
 * Creates a new note for the authenticated user.
 * @param {number} userId
 * @param {NotePayload} payload
 * @returns {Promise<object>}
 */
async function createNote(userId, { title, content, category, tags, is_pinned, is_favorite }) {
  const cleanTitle = sanitizePlainText(title);
  if (!cleanTitle) {
    const error = new Error('Title is required and must contain readable text');
    /** @type {any} */ (error).statusCode = 400;
    /** @type {any} */ (error).code = 'VALIDATION_ERROR';
    /** @type {any} */ (error).isOperational = true;
    throw error;
  }
  const cleanContent = sanitizeRichContent(content);

  const createPayload = {
    user_id: userId,
    title: cleanTitle,
    content: cleanContent,
    is_pinned: is_pinned ? 1 : 0,
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

  return notesModel.create(createPayload);
}

/**
 * Retrieves all notes for a user matching optional filters.
 * @param {number} userId
 * @param {NoteFilters} [filters={}]
 * @returns {Promise<Array<object>>}
 */
async function getNotesByUser(userId, filters = {}) {
  return notesModel.findAllByUser(userId, filters);
}

/**
 * Paginates in-memory note list.
 * @param {Array<object>} notes
 * @param {string|number} [page=1]
 * @param {string|number} [limit=10]
 * @returns {{ items: Array<object>, pagination: { page: number, limit: number, total: number, totalPages: number } }}
 */
function paginateNotes(notes, page, limit) {
  const list = Array.isArray(notes) ? notes : [];
  const total = list.length;

  const parsedPage = Math.max(1, parseInt(String(page), 10) || 1);
  const parsedLimit = limit ? Math.max(1, Math.min(100, parseInt(String(limit), 10) || 10)) : total || 10;
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
 * Gets a single note by id ensuring ownership.
 * @param {number|string} noteId
 * @param {number} userId
 * @returns {Promise<object>}
 */
async function getNoteById(noteId, userId) {
  const note = await notesModel.findById(noteId, userId);
  assertOwnership(note, userId);
  return note;
}

/**
 * Updates an existing note.
 * @param {number|string} noteId
 * @param {number} userId
 * @param {Partial<NotePayload>} payload
 * @returns {Promise<object>}
 */
async function updateNote(noteId, userId, { title, content, category, tags, is_pinned, is_favorite }) {
  const note = await notesModel.findById(noteId, userId);
  assertOwnership(note, userId);

  const fields = {};

  if (title !== undefined) {
    const cleanTitle = sanitizePlainText(title);
    if (!cleanTitle) {
      const error = new Error('Title cannot be empty');
      /** @type {any} */ (error).statusCode = 400;
      /** @type {any} */ (error).code = 'VALIDATION_ERROR';
      /** @type {any} */ (error).isOperational = true;
      throw error;
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

  return notesModel.update(noteId, userId, fields);
}

/**
 * Deletes a note by id ensuring ownership.
 * @param {number|string} noteId
 * @param {number} userId
 * @returns {Promise<void>}
 */
async function deleteNote(noteId, userId) {
  const note = await notesModel.findById(noteId, userId);
  assertOwnership(note, userId);
  await notesModel.deleteById(noteId, userId);
}

module.exports = {
  createNote,
  getNotesByUser,
  paginateNotes,
  getNoteById,
  updateNote,
  deleteNote,
};
