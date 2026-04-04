import { Schema, model, Document, Types } from 'mongoose';

export interface IReadingSession {
  startedAt: Date;
  endedAt: Date;
  duration: number;      // seconds
  pagesRead: number[];   // which pages were visited
  focusScore: number;    // 0-100
  distractionCount: number;
}

export interface IRecentFile extends Document {
  user: Types.ObjectId;
  name: string;
  size: number;
  isUrl?: boolean;
  fileId: string;
  file_path: string;

  // progress
  lastPage?: number;
  totalPages?: number;
  lastOpenedAt?: Date;

  // analytics
  timeSpent?: number;           // total seconds across all sessions
  totalSessions?: number;       // how many times opened
  avgFocusScore?: number;       // rolling average
  readingSessions?: IReadingSession[];

  createdAt?: Date;
  updatedAt?: Date;
}

const ReadingSessionSchema = new Schema<IReadingSession>({
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, required: true },
  duration: { type: Number, required: true },
  pagesRead: [{ type: Number }],
  focusScore: { type: Number, default: 0 },
  distractionCount: { type: Number, default: 0 },
}, { _id: false });

const RecentFileSchema = new Schema<IRecentFile>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: { type: String, required: true },
  file_path: { type: String, required: true },
  size: { type: Number, required: true },
  isUrl: { type: Boolean, default: false },
  fileId: { type: String, required: true },

  // progress
  lastPage: { type: Number, default: 0 },
  totalPages: { type: Number, default: 0 },
  lastOpenedAt: { type: Date, default: Date.now },

  // analytics
  timeSpent: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
  avgFocusScore: { type: Number, default: 0 },
  readingSessions: {
    type: [ReadingSessionSchema],
    default: [],
    // cap at 30 sessions to keep document size bounded
    validate: {
      validator: (v: IReadingSession[]) => v.length <= 30,
      message: 'Max 30 sessions stored per file',
    },
  },
}, {
  timestamps: true,
});

const RecentFile = model<IRecentFile>('RecentFile', RecentFileSchema);

export default RecentFile;