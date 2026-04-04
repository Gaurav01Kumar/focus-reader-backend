import { Request, Response } from 'express';
import Folder from '../models/Folder';
import { successResponse, errorResponse } from '../utils/response';
import { log } from '../utils/logger';
import User from '../models/User';

export const getFolders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const folders = await Folder.find({ user: userId });
    return successResponse(res, 'Folders fetched successfully', folders);
  } catch (err: any) {
    log('Error fetching folders', err.message);
    return errorResponse(res, 'Server Error', err, 500);
  }
};

export const createFolder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, description, color } = req.body;

    if (!name) {
      return errorResponse(res, 'Folder name is required', 400);
    }

    const newFolder = new Folder({
      user: userId,
      name,
      description,
      color,
    });

    const folder = await newFolder.save();
    log('Folder created', { folderId: folder._id, userId });
    return successResponse(res, 'Folder created successfully', folder, 201);
  } catch (err: any) {
    log('Error creating folder', err.message);
    return errorResponse(res, 'Server Error', err, 500);
  }
};

export const updateFolder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, description, color } = req.body;

    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return errorResponse(res, 'Folder not found', 404);
    }

    if (folder.user.toString() !== userId) {
      return errorResponse(res, 'Not authorized', 401);
    }

    folder.name = name ?? folder.name;
    // folder.description = description ?? folder.description;
    // folder.color = color ?? folder.color;

    await folder.save();
    log('Folder updated', { folderId: folder._id });
    return successResponse(res, 'Folder updated successfully', folder);
  } catch (err: any) {
    log('Error updating folder', err.message);
    return errorResponse(res, 'Server Error', err, 500);
  }
};

export const deleteFolder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const folder = await Folder.findById(req.params.id);
    if (!folder) return errorResponse(res, 'Folder not found', 404);

    if (folder.user.toString() !== userId) {
      return errorResponse(res, 'Not authorized', 401);
    }

    await folder.deleteOne();
    log('Folder deleted', { folderId: req.params.id });
    return successResponse(res, 'Folder removed successfully');
  } catch (err: any) {
    log('Error deleting folder', err.message);
    return errorResponse(res, 'Server Error', err, 500);
  }
};

export const getFolderById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const folder = await Folder.findOne({ _id: req.params.id, user: userId });

    if (!folder) return errorResponse(res, 'Folder not found', 404);
    return successResponse(res, 'Folder fetched successfully', folder);
  } catch (err: any) {
    log('Error fetching folder by ID', err.message);
    return errorResponse(res, 'Server Error', err, 500);
  }
};