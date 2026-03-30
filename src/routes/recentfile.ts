import { Router } from "express";
import {
  getRecentFiles,
  createRecentFile,
  deleteRecentFile,
  getRecentFileById,
} from "../controllers/recent";

const router = Router();

// @route   GET /api/recent
router.get('/', getRecentFiles);

// @route   GET /api/recent/:id
router.get('/:id', getRecentFileById);

// @route   POST /api/recent
router.post('/', createRecentFile);

// @route   DELETE /api/recent/:id
router.delete('/:id', deleteRecentFile);

export default router;