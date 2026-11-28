'use strict';

const notesService = require('../services/notesService');
const logger = require('../config/logger');

/**
 * @typedef {Object} AuthenticatedUser
 * @property {number} userId
 * @property {string} email
 */

/**
 * @typedef {import('express').Request & { user: AuthenticatedUser }} AuthenticatedRequest
 */

/**
 * Create a new note.
 * @param {AuthenticatedRequest} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<import('express').Response | void>}
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
 * Get all notes for the authenticated user, supporting filtering, sorting, and pagination.
 * @param {AuthenticatedRequest} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<import('express').Response | void>}
 */
async function getAllNotes(req, res, next) {
  try {
    const { search, category, tag, sort, favorite, pinned, page, limit } = req.query;

    const scalarFilters = { search, category, tag, sort, favorite, pinned, page, limit };
    for (const [key, value] of Object.entries(scalarFilters)) {
      if (value !== undefined && typeof value !== 'string') {
        return res.status(400).json({
          success: false,
          message: `Query parameter "${key}" must be a string`,
          code: 'VALIDATION_ERROR',
        });
      }
    }

    const filters = {};
    if (search) filters.search = search;
    if (category) filters.category = category;
    if (tag) filters.tag = tag;
    if (sort) filters.sort = sort;
    if (favorite !== undefined) filters.favorite = favorite;
    if (pinned !== undefined) filters.pinned = pinned;

    const allNotes = await notesService.getNotesByUser(req.user.userId, filters);
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
 * Get a single note by id for the authenticated user.
 * @param {AuthenticatedRequest} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<import('express').Response | void>}
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
 * Update an existing note.
 * @param {AuthenticatedRequest} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<import('express').Response | void>}
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
 * Delete a note by id.
 * @param {AuthenticatedRequest} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<import('express').Response | void>}
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

module.exports = {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
};
