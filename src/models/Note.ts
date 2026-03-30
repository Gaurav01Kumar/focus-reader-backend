import { Schema, model, Document, Types } from 'mongoose';

export interface INote extends Document {
  user: Types.ObjectId;
  text: string;
  explanation?: string;
  pageNumber?: number;
  folderId?: Types.ObjectId;
  color?: string;
  highlight?: string;
  fileId:Types.ObjectId
}

const NoteSchema = new Schema<INote>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
  },
  pageNumber: {
    type: Number,
  },
  folderId: {
    type: Schema.Types.ObjectId,
    ref: 'Folder',
  },
  color: {
    type: String,
  },
  highlight: {
    type: String,
  },
  fileId: {
   type: Schema.Types.ObjectId,
   ref: 'RecentFile',
   required: true,
  },
}, {
  timestamps: true,
});

const Note = model<INote>('Note', NoteSchema);

export default Note;
