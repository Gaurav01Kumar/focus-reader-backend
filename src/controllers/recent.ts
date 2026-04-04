import { Request, Response } from 'express';
import RecentFile, { IReadingSession } from '../models/RecentFile';
import { successResponse, errorResponse } from '../utils/response';
import { log } from '../utils/logger';
import mongoose from 'mongoose';

export const getRecentFiles = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const files = await RecentFile.find({ user: userId }).sort({ updatedAt: -1 });
    return successResponse(res, 'Recent files fetched successfully', files, 200);
  } catch (err: any) {
    log('Error fetching recent files', err.message);
    return errorResponse(res, 'Server Error', err, 500);
  }
};

export const createRecentFile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, size, isUrl, fileId, file_path, lastPage, lastOpenedAt } = req.body;

    if (!name || !fileId || !file_path) {
      return errorResponse(res, 'Missing required fields', 400);
    }

    // Check if file already exists for this user to update timestamp instead of creating duplicate
    let file = await RecentFile.findOne({ user: userId, fileId });

    if (file) {
      file.updatedAt = new Date();
      await file.save();
    } else {
      file = new RecentFile({
        user: userId,
        name,
        size,
        isUrl,
        fileId,
        file_path,
        lastPage,
        lastOpenedAt
      });
      await file.save();
    }

    log('Recent file recorded', { fileId: file.fileId, userId });
    return successResponse(res, 'Recent file recorded successfully', file, 201);
  } catch (err: any) {
    log('Error creating recent file record', err.message);
    return errorResponse(res, 'Server Error', err, 500);
  }
};

export const deleteRecentFile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const file = await RecentFile.findById(req.params.id);

    if (!file) return errorResponse(res, 'File record not found', 404);

    if (file.user.toString() !== userId) {
      return errorResponse(res, 'Not authorized', 401);
    }

    await file.deleteOne();
    log('Recent file record deleted', { id: req.params.id });
    return successResponse(res, 'Recent file record removed successfully', null, 200);
  } catch (err: any) {
    log('Error deleting recent file record', err.message);
    return errorResponse(res, 'Server Error', err, 500);
  }
};

export const getRecentFileById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const file = await RecentFile.findOne({ _id: req.params.id, user: userId });

    if (!file) return errorResponse(res, 'File record not found', 404);
    return successResponse(res, 'Recent file fetched successfully', file, 200);
  } catch (err: any) {
    log('Error fetching recent file by ID', err.message);
    return errorResponse(res, 'Server Error', 500, err);
  }
};
export const updateLastReadPage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    let data = req.body;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) {
        console.error('JSON Parse Error:', e);
        return res.status(400).json({ message: 'Invalid JSON' });
      }
    }

    const { lastPage, fileId, totalPages, timeSpent, focusScore, distractionCount, pagesRead } = data;

    const file = await RecentFile.findOne({ user: userId, _id: fileId });
    if (!file) return res.status(404).json({ message: 'File not found' });

    // ── Progress ───────────────────────────────────────────────────────────
    file.lastPage = lastPage ?? file.lastPage;
    file.lastOpenedAt = new Date();
    if (totalPages && (totalPages !== file.totalPages || file.totalPages === 0)) {
      file.totalPages = totalPages;
    }

    // ── Session ────────────────────────────────────────────────────────────
    const sessionDuration = Number(timeSpent) || 0;

    if (sessionDuration > 0) {
      const session: IReadingSession = {
        startedAt: new Date(Date.now() - sessionDuration * 1000),
        endedAt: new Date(),
        duration: sessionDuration,
        pagesRead: Array.isArray(pagesRead) ? pagesRead : [],
        focusScore: Number(focusScore) ?? 100,
        distractionCount: Number(distractionCount) ?? 0,
      };

      // rolling average focus score
      const prevTotal = (file.avgFocusScore ?? 0) * (file.totalSessions ?? 0);
      const newSessionCount = (file.totalSessions ?? 0) + 1;
      file.avgFocusScore = Math.round((prevTotal + session.focusScore) / newSessionCount);
      file.totalSessions = newSessionCount;

      // accumulate total time
      file.timeSpent = (file.timeSpent ?? 0) + sessionDuration;

      // cap sessions array at 30 — drop oldest
      const sessions = [...(file.readingSessions ?? []), session];
      file.readingSessions = sessions.length > 30 ? sessions.slice(-30) : sessions;
    }

    await file.save();
    return res.status(204).send();

  } catch (err: any) {
    console.error('CRITICAL SERVER ERROR:', err.stack);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};