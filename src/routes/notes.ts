import { Router } from 'express';

import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getNoteById,
  getNotesByFileId,
} from '../controllers/notes';

const router = Router();

// @route   GET /api/notes
// @desc    Get all notes for a user
// @access  Private
router.get('/', getNotes);

router.get('/by-pdf-id',getNotesByFileId)
// @route   GET /api/notes/:id
// @desc    Get note by ID
// @access  Private

router.get('/:id', getNoteById);


// @route   POST /api/notes
// @desc    Create a new note
// @access  Private
router.post('/', createNote);

// @route   PUT /api/notes/:id
// @desc    Update a note
// @access  Private
router.put('/:id', updateNote);

// @route   DELETE /api/notes/:id
// @desc    Delete a note
// @access  Private
router.delete('/:id', deleteNote);

export default router;
