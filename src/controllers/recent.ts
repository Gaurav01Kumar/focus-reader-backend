import { Request, Response } from 'express';
import RecentFile from '../models/RecentFile';
import { successResponse, errorResponse } from '../utils/response';
import { log } from '../utils/logger';

export const getRecentFiles = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const files = await RecentFile.find({ user: userId }).sort({ updatedAt: -1 });
    return successResponse(res, 'Recent files fetched successfully', files, 200);
  } catch (err: any) {
    log('Error fetching recent files', err.message);
    return errorResponse(res, 'Server Error',err,500);
  }
};

export const createRecentFile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, size, isUrl, fileId, file_path } = req.body;

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
      });
      await file.save();
    }

    log('Recent file recorded', { fileId: file.fileId, userId });
    return successResponse(res, 'Recent file recorded successfully', file, 201);
  } catch (err: any) {
    log('Error creating recent file record', err.message);
    return errorResponse(res, 'Server Error', err,500);
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
    return errorResponse(res, 'Server Error', err,500);
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