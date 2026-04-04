import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  googleId: string;
  displayName?: string;
  email?: string;
  image?: string;
  password?: string;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
    },
    displayName: String,
    email: String,
    image: String,
    password: {
      type: String,
    },
  },
  { timestamps: true }
);

const User = model<IUser>('User', UserSchema);

export default User;