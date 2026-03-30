import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  displayName?: string;
  email?: string;
  image?: string;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    displayName: String,
    email: String,
    image: String,
  },
  { timestamps: true }
);

const User = model<IUser>('User', UserSchema);

export default User;