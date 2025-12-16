import mongoose from "mongoose";
import { ObjectId } from "mongodb";

export type UserAuthDocument = {
  userId: ObjectId;
  email: string | null;
  pwdHash: string | null;
  githubId: string | null;
  googleId: string | null;
}

const userAuthSchema = new mongoose.Schema({
  userId: {type: ObjectId, ref: 'Users', required: true, unique: true},
  email: {type: String, required: false},
  pwdHash: {type: String, required: false},
  githubId: {type: String, required: false},
  googleId: {type: String, required: false},
}, {
  timestamps: true,
});

const User_Auth = mongoose.model('User_Auth', userAuthSchema);
export default User_Auth;