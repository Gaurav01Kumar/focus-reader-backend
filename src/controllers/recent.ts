import { Request, Response } from 'express';
import RecentFile from '../models/RecentFile';
import { successResponse, errorResponse } from '../utils/response';
import { getAuth } from '@clerk/express';
import { log } from '../utils/logger';
import mongoose from 'mongoose';
import User from '../models/User';

// Helper to get user ID from Clerk
const getClerkId = (req: Request) => {
  const { userId } = getAuth(req);
  if (!userId) throw new Error('Unauthorized');
  return userId;
};

export const getRecentFiles = async (req: Request, res: Response) => {
  try {
    const clerkId = getClerkId(req);
    const user=await User.findOne({
      clerkId
    });
    if(!user) return errorResponse(res, 'User not found', null,404);
    const files = await RecentFile.find({ user: user?._id }).sort({ updatedAt: -1 });
    return successResponse(res, 'Recent files fetched successfully', files, 200);
  } catch (err: any) {
    log('Error fetching recent files', err.message);
    return errorResponse(res, 'Server Error',err,500);
  }
};

export const createRecentFile = async (req: Request, res: Response) => {
  try {
    const clerkId = getClerkId(req);
    const { name, size, isUrl, fileId, file_path } = req.body;

    if (!name || !fileId || !file_path) {
      return errorResponse(res, 'Missing required fields', 400);
    }
   const user=await User.findOne({
      clerkId
    });
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Check if file already exists for this user to update timestamp instead of creating duplicate
    let file = await RecentFile.findOne({ user: user?._id, fileId });
 
    if (file) {
      file.updatedAt = new Date();
      await file.save();
    } else {
      file = new RecentFile({
        user: user?._id,
        name,
        size,
        isUrl,
        fileId,
        file_path,
      });
      await file.save();
    }

    log('Recent file recorded', { fileId: file.fileId, userId: clerkId });
    return successResponse(res, 'Recent file recorded successfully', file, 201);
  } catch (err: any) {
    log('Error creating recent file record', err.message);
    return errorResponse(res, 'Server Error', err,500);
  }
};

export const deleteRecentFile = async (req: Request, res: Response) => {
  try {
    const clerkId = getClerkId(req);
  

    const file = await RecentFile.findById(req.params.id);

    if (!file) return errorResponse(res, 'File record not found', 404);

    // if (file.user.toString() !== clerkId) {
    //   return errorResponse(res, 'Not authorized', 401);
    // }

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
    const clerkId = getClerkId(req);
    const user=await User.findOne({
      clerkId
    });
if(!user) return errorResponse(res, 'User not found', null,404)
    const file = await RecentFile.findOne({ _id: req.params.id, user: user?._id });

    if (!file) return errorResponse(res, 'File record not found', 404);
    return successResponse(res, 'Recent file fetched successfully', file, 200);
  } catch (err: any) {
    log('Error fetching recent file by ID', err.message);
    return errorResponse(res, 'Server Error', 500, err);
  }
};