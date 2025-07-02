import mongoose from "mongoose";
import { ObjectId } from "mongodb";

const userAuthSchema = new mongoose.Schema({
  userId: {type: ObjectId, ref: 'Users', required: true, unique: true},
  email: {type: String, required: false},
  pwdHash: {type: String, required: false},
  githubAccessToken: {type: String, required: false},
  googleAccessToken: {type: String, required: false},
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const User_Auth = mongoose.model('User_Auth', userAuthSchema);
export default User_Auth;