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
  exportNote,
  importNote,
} = require('../controllers/notesController');

const router = Router();

router.use(protect);

router.get('/', getAllNotes);
router.post('/import', importNote);
router.post('/', noteValidation, validate, createNote);
router.get('/:id/export', exportNote);
router.get('/:id', getNoteById);
router.put('/:id', updateNoteValidation, validate, updateNote);
router.delete('/:id', deleteNote);

module.exports = router;
