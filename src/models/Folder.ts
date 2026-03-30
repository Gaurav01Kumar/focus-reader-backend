import { Schema, model, Document, Types } from 'mongoose';

export interface IFolder extends Document {
  user: Types.ObjectId;
  name: string;
  description?: string;
  color?: string;
}

const FolderSchema = new Schema<IFolder>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  color: {
    type: String,
  },
}, {
  timestamps: true,
});

const Folder = model<IFolder>('Folder', FolderSchema);

export default Folder;
