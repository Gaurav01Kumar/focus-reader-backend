import { Request, Response } from 'express';
import Folder from '../models/Folder';
import { successResponse, errorResponse } from '../utils/response';
import { getAuth } from '@clerk/express';
import { log } from '../utils/logger';
import User from '../models/User';
// Helper to get user ID from Clerk
const getClerkId = (req: Request) => {
  const { userId } = getAuth(req);
  if (!userId) throw new Error('Unauthorized');

  return userId;
};

export const getFolders = async (req: Request, res: Response) => {
  try {
    const clerkId = getClerkId(req);
    const user = await User.findOne({
      clerkId
    });
    if (!user) return errorResponse(res, 'User not found', null, 404);  
    const folders = await Folder.find({ user: user._id });
    return successResponse(res, 'Folders fetched successfully', folders);
  } catch (err: any) {
    log('Error fetching folders', err.message);
    return errorResponse(res, 'Server Error', err, 500);
  }
};

export const createFolder = async (req: Request, res: Response) => {
  try {
    const clerkId = getClerkId(req);
    const { name, description, color } = req.body;

    if (!name) {
      return errorResponse(res, 'Folder name is required', 400);
    }

    const user = await User.findOne({
      clerkId
    });
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    const newFolder = new Folder({
      user: user?._id,
      name,
      description,
      color,
    });

    const folder = await newFolder.save();
    log('Folder created', { folderId: folder._id, userId: clerkId });
    return successResponse(res, 'Folder created successfully', folder, 201);
  } catch (err: any) {
    log('Error creating folder', err.message);
    return errorResponse(res, 'Server Error', err, 500);
  }
};

export const updateFolder = async (req: Request, res: Response) => {
  try {
    const clerkId = getClerkId(req);
    const { name, description, color } = req.body;

    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return errorResponse(res, 'Folder not found', 404);
    }

    if (folder.user.toString() !== clerkId) {
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
    const clerkId = getClerkId(req);

    const folder = await Folder.findById(req.params.id);
    if (!folder) return errorResponse(res, 'Folder not found', 404);

    // if (folder.user.toString() !== clerkId) {
    //   return errorResponse(res, 'Not authorized', 401);
    // }

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
    const clerkId = getClerkId(req);
    const folder = await Folder.findOne({ _id: req.params.id, user: clerkId });

    if (!folder) return errorResponse(res, 'Folder not found', 404);
    return successResponse(res, 'Folder fetched successfully', folder);
  } catch (err: any) {
    log('Error fetching folder by ID', err.message);
    return errorResponse(res, 'Server Error', err, 500);
  }
};