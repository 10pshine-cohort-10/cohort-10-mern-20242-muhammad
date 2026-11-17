'use strict';

const notesService = require('../services/notesService');
const logger = require('../config/logger');

/**
 * POST /api/notes
 */
async function createNote(req, res, next) {
  try {
    const { title, content, category, tags, is_pinned, is_favorite } = req.body;
    const note = await notesService.createNote(req.user.userId, {
      title,
      content,
      category,
      tags,
      is_pinned,
      is_favorite,
    });
    logger.info({ event: 'note.created', userId: req.user.userId, noteId: note.id }, 'Note created successfully');
    return res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: { note },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/notes
 */
async function getAllNotes(req, res, next) {
  try {
    const { page, limit } = req.query;
    const allNotes = await notesService.getNotesByUser(req.user.userId);
    const { items: notes, pagination } = notesService.paginateNotes(allNotes, page, limit);

    logger.debug({ event: 'notes.list', userId: req.user.userId, count: notes.length }, 'Notes retrieved');
    return res.json({
      success: true,
      message: 'Notes retrieved successfully',
      data: { notes, pagination },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/notes/:id
 */
async function getNoteById(req, res, next) {
  try {
    const note = await notesService.getNoteById(req.params.id, req.user.userId);
    logger.debug({ event: 'note.get', userId: req.user.userId, noteId: note.id }, 'Note retrieved');
    return res.json({
      success: true,
      message: 'Note retrieved successfully',
      data: { note },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/notes/:id
 */
async function updateNote(req, res, next) {
  try {
    const { title, content, category, tags, is_pinned, is_favorite } = req.body;
    const note = await notesService.updateNote(req.params.id, req.user.userId, {
      title,
      content,
      category,
      tags,
      is_pinned,
      is_favorite,
    });
    logger.info({ event: 'note.updated', userId: req.user.userId, noteId: note.id }, 'Note updated successfully');
    return res.json({
      success: true,
      message: 'Note updated successfully',
      data: { note },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/notes/:id
 */
async function deleteNote(req, res, next) {
  try {
    await notesService.deleteNote(req.params.id, req.user.userId);
    logger.info(
      { event: 'note.deleted', userId: req.user.userId, noteId: Number(req.params.id) },
      'Note deleted successfully'
    );
    return res.json({
      success: true,
      message: 'Note deleted successfully',
      data: null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/notes/:id/export?format=txt|pdf
 */
async function exportNote(req, res, next) {
  try {
    const format = req.query.format || 'txt';
    const { buffer, mimeType, filename } = await notesService.exportNote(
      req.params.id,
      req.user.userId,
      format
    );
    logger.info(
      { event: 'note.exported', userId: req.user.userId, noteId: Number(req.params.id), format },
      'Note exported successfully'
    );
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(buffer);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/notes/import
 */
async function importNote(req, res, next) {
  try {
    const note = await notesService.importNote(req.user.userId, req.body);
    logger.info({ event: 'note.imported', userId: req.user.userId, noteId: note.id }, 'Note imported successfully');
    return res.status(201).json({
      success: true,
      message: 'Note imported successfully',
      data: { note },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
  exportNote,
  importNote,
};
