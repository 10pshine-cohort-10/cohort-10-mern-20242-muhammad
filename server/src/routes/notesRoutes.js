'use strict';

const { Router } = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  noteValidation,
  updateNoteValidation,
  validate,
} = require('../middleware/validateMiddleware');
const {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
} = require('../controllers/notesController');

/** @type {import('express').Router} */
const router = Router();

router.use(protect);

router.get('/', getAllNotes);
router.post('/', noteValidation, validate, createNote);
router.get('/:id', getNoteById);
router.put('/:id', updateNoteValidation, validate, updateNote);
router.delete('/:id', deleteNote);

module.exports = router;
