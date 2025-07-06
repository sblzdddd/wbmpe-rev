import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import Playlists from "./Playlists";
import UserAuth from "./UserAuth";
import type { SimpleUser } from "~/types/User/User";

export type UserDocument = {
  _id: ObjectId;
  bio: string;
  userName: string;
  nickName: string;
  avatarUrl: string;
  createdPlaylists: ObjectId[];
  favId: ObjectId;
  recentId: ObjectId;
}

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
  statics: {
    createNewUser: async (userName: string, email: string, pwdHash: string): Promise<SimpleUser> => {
      // Create default playlists first
      const favoritesPlaylist = await Playlists.createNewFavoritesPlaylist(null);
      const recentPlaylist = await Playlists.createNewRecentPlaylist(null);

      // Create user
      const user = await Users.create({
        userName,
        nickName: userName,
        bio: '',
        avatarUrl: '',
        createdPlaylists: [],
        favId: favoritesPlaylist._id,
        recentId: recentPlaylist._id,
      });
    
      // Update playlists with owner
      await Playlists.updateOne({ _id: favoritesPlaylist._id }, { owner: user._id });
      await Playlists.updateOne({ _id: recentPlaylist._id }, { owner: user._id });
    
      // Create user auth
      await UserAuth.create({userId: user._id, email, pwdHash});

      const userData = user.toObject() as unknown as SimpleUser;
      userData._id = user._id.toString();
      return userData;
    }
  }
});

const Users = mongoose.model('Users', userSchema);

export default Users;
