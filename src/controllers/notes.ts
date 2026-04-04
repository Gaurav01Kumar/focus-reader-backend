import { Request, Response } from 'express';
import Note from '../models/Note';
import { successResponse, errorResponse } from '../utils/response';
import { log } from '../utils/logger';
import User from '../models/User';

// TEMP: Replace this with your own auth middleware later
const getUserId = (req: Request) => {
  // Example: if you store user in req.user via JWT middleware
  return (req as any).user?.id;
};

export const getNotes = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const notes = await Note.find({ user: userId });
    return successResponse(res, 'Notes fetched successfully', notes);
  } catch (err: any) {
    log('Error fetching notes', err.message);
    return errorResponse(res, 'Server Error', 500, err);
  }
};

export const createNote = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { text, explanation, pageNumber, folderId, color, highlight, fileId } = req.body;

    if (!text || !fileId) {
      return errorResponse(res, 'Text and fileId are required', 400);
    }

    const user = await User.findById(userId);
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
    log('Note created', { noteId: note._id, userId });

    return successResponse(res, 'Note created successfully', note, 201);
  } catch (err: any) {
    console.error(err.message);
    return errorResponse(res, 'Server Error', 500, err);
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { text, explanation, pageNumber, folderId, color, highlight } = req.body;

    const note = await Note.findById(req.params.id);
    if (!note) return errorResponse(res, 'Note not found', 404);

    if (note.user.toString() !== userId) {
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
    const userId = getUserId(req);

    const note = await Note.findById(req.params.id);
    if (!note) return errorResponse(res, 'Note not found', 404);

    if (note.user.toString() !== userId) {
      return errorResponse(res, 'Not authorized', 401);
    }

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
    const userId = getUserId(req);

    const note = await Note.findOne({ _id: req.params.id, user: userId });
    if (!note) return errorResponse(res, 'Note not found', 404);

    return successResponse(res, 'Note fetched successfully', note);
  } catch (err: any) {
    console.error(err.message);
    return errorResponse(res, 'Server Error', 500, err);
  }
};

export const getNotesByFileId = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { fileId } = req.query;

    if (!fileId) {
      return errorResponse(res, 'File ID is required', 400);
    }

    const notes = await Note.find({ user: userId, fileId });
    return successResponse(res, 'Notes fetched successfully', notes);
  } catch (err: any) {
    return errorResponse(res, 'Server Error', 500, err.message);
  }
};