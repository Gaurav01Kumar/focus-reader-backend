import { Schema, model, Document, Types } from 'mongoose';

export interface IRecentFile extends Document {
  user: Types.ObjectId;
  name: string;
  size: number;
  isUrl?: boolean;
  fileId: string;
  file_path: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const RecentFileSchema = new Schema<IRecentFile>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  file_path: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  isUrl: {
    type: Boolean,
    default: false,
  },
  fileId: {
    type: String,
    required: true,
  },
  createdAt:{
      type:Date,
      default:Date.now
  },
  updatedAt:{
    type:Date,
    default:Date.now
}
}, {
  timestamps: true,
});

const RecentFile = model<IRecentFile>('RecentFile', RecentFileSchema);

export default RecentFile;
