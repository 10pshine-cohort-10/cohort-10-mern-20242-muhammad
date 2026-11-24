'use strict';

const notesModel = require('../models/notesModel');
const { sanitizePlainText, sanitizeRichContent } = require('../utils/sanitize');

function assertOwnership(note, userId) {
  if (!note || note.user_id !== userId) {
    const error = new Error('Note not found');
    error.statusCode = 404;
    error.code = 'NOTE_NOT_FOUND';
    throw error;
  }
}

function normalizeTags(tags) {
  if (!tags) return '';
  const raw = Array.isArray(tags) ? tags.join(', ') : String(tags);
  return sanitizePlainText(raw).slice(0, 255);
}

async function createNote(userId, { title, content, category, tags, is_pinned, is_favorite }) {
  const cleanTitle = sanitizePlainText(title);
  if (!cleanTitle) {
    const error = new Error('Title is required and must contain readable text');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
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

  return notesModel.create(createPayload);
}

async function getNotesByUser(userId, filters = {}) {
  return notesModel.findAllByUser(userId, filters);
}

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

async function getNoteById(noteId, userId) {
  const note = await notesModel.findById(noteId, userId);
  assertOwnership(note, userId);
  return note;
}

async function updateNote(noteId, userId, { title, content, category, tags, is_pinned, is_favorite }) {
  const note = await notesModel.findById(noteId, userId);
  assertOwnership(note, userId);

  const fields = {};

  if (title !== undefined) {
    const cleanTitle = sanitizePlainText(title);
    if (!cleanTitle) {
      const error = new Error('Title cannot be empty');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
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
