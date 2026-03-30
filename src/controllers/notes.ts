import { Request, Response } from 'express';
import Note from '../models/Note';
import { successResponse, errorResponse } from '../utils/response';
import { getAuth } from '@clerk/express';
import { log } from '../utils/logger';
import User from '../models/User';

// Helper to get current user
const getClerkId = (req: Request) => {
  const { userId } = getAuth(req);
  if (!userId) throw new Error('Unauthorized');
  return userId;
};

export const getNotes = async (req: Request, res: Response) => {
  try {
    const clerkId = getClerkId(req);
    const notes = await Note.find({ user: clerkId });
    return successResponse(res, 'Notes fetched successfully', notes);
  } catch (err: any) {    
    log('Error fetching notes', err.message);
    return errorResponse(res, 'Server Error', 500, err);
  }
};

export const createNote = async (req: Request, res: Response) => {
  try {
    const clerkId = getClerkId(req);
    const { text, explanation, pageNumber, folderId, color, highlight,fileId } = req.body;

    if (!text || !fileId) {
      return errorResponse(res, 'Text is required', 400);
    }
    const user=await User.findOne({
      clerkId
    });

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }


    const newNote = new Note({
      user: user._id,
      text,
      explanation,
      pageNumber,
      folderId,
      color,
      highlight,
      fileId
    });

    const note = await newNote.save();
    log('Note created', { noteId: note._id, userId: clerkId });
    return successResponse(res, 'Note created successfully', note, 201);
  } catch (err: any) {    
    console.error(err.message);
    return errorResponse(res, 'Server Error', 500, err);
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const clerkId = getClerkId(req);
    const { text, explanation, pageNumber, folderId, color, highlight,fileId } = req.body;

    const note = await Note.findById(req.params.id);
    if (!note) return errorResponse(res, 'Note not found', 404);

    if (note.user.toString() !== clerkId) {
      return errorResponse(res, 'Not authorized', 401);
    }

    note.text = text ?? note.text;
    note.explanation = explanation ?? note.explanation;
    note.pageNumber = pageNumber ?? note.pageNumber;
    note.folderId = folderId ?? note.folderId;
    note.color = color ?? note.color;
    note.highlight = highlight ?? note.highlight;

    await note.save();
    log('Note updated', { noteId: note._id });
    return successResponse(res, 'Note updated successfully', note);
  } catch (err: any) {    
    console.error(err.message);
    return errorResponse(res, 'Server Error', 500, err);
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  try {
    const clerkId = getClerkId(req);
    const note = await Note.findById(req.params.id);
    if (!note) return errorResponse(res, 'Note not found', 404);

    // if (note.user.toString() !== clerkId) {
    //   return errorResponse(res, 'Not authorized', 401);
    // }

    await note.deleteOne();
    log('Note deleted', { noteId: req.params.id });
    return successResponse(res, 'Note removed successfully');
  } catch (err: any) {    
    console.error(err.message);
    return errorResponse(res, 'Server Error', 500, err);
  }
};

export const getNoteById = async (req: Request, res: Response) => {
  try {
    const clerkId = getClerkId(req);
    const note = await Note.findOne({ _id: req.params.id, user: clerkId });

    if (!note) return errorResponse(res, 'Note not found', 404);
    return successResponse(res, 'Note fetched successfully', note);
  } catch (err: any) {    
    console.error(err.message);
    return errorResponse(res, 'Server Error', 500, err);
  }
};

export const getNotesByFileId = async (req: Request, res: Response) => {
  try {
    const clerkId = getClerkId(req);
    const { fileId } = req.query;

    if (!fileId) {
      return errorResponse(res, 'File ID is required', 400);
    }
    const user=await User.findOne({
      clerkId
    });
    if(!user) return errorResponse(res, 'User not found', null,404)
      const notes = await Note.find({ user: user?._id, fileId })
    return successResponse(res, 'Notes fetched successfully', notes)
    } catch (err: any) {
      return errorResponse(res,"server Error",err.message,500);
    }
  }