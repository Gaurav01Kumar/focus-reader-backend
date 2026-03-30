import { Router } from 'express';

import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  getFolderById,
} from '../controllers/folder';

const router = Router();

// @route   GET /api/folders
// @desc    Get all folders for a user
// @access  Private
router.get('/', getFolders);

// @route   GET /api/folders/:id
// @desc    Get folder by ID
// @access  Private
router.get('/:id', getFolderById);

// @route   POST /api/folders
// @desc    Create a new folder
// @access  Private
router.post('/', createFolder);

// @route   PUT /api/folders/:id
// @desc    Update a folder
// @access  Private
router.put('/:id', updateFolder);

// @route   DELETE /api/folders/:id
// @desc    Delete a folder
// @access  Private
router.delete('/:id', deleteFolder);

export default router;
