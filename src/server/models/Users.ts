import mongoose from "mongoose";
import { ObjectId } from "mongodb";

const userSchema = new mongoose.Schema({
  avatarUrl: {type: String, required: false},
  createdPlaylists: [{type: ObjectId, ref: 'Playlists'}],
  userName: {type: String, required: true, unique: true},
  nickName: {type: String, required: false},
  bio: {type: String, required: false},
  favId: {type: ObjectId, ref: 'Playlists', required: true},
  recentId: {type: ObjectId, ref: 'Playlists', required: true},
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const Users = mongoose.model('Users', userSchema);
export default Users;