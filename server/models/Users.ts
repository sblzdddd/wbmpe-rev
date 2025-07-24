/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import Playlists, { type PlaylistDocument } from "./Playlists";
import UserAuth from "./UserAuth";
import { imageUploadService } from "../utils/imageUpload";
import type { SimpleUser, UserInfo, UserPlaylists } from "../../types/User/User";

export type UserDocument = {
  _id: ObjectId;
  bio: string|null;
  userName: string;
  nickName: string;
  avatarUrl: string;
  createdPlaylists: ObjectId[];
  favorites: ObjectId;
  recent: ObjectId;
}

const userSchema = new mongoose.Schema({
  avatarUrl: {type: String, required: false},
  createdPlaylists: [{type: ObjectId, ref: 'Playlists'}],
  userName: {type: String, required: true, unique: true},
  nickName: {type: String, required: false},
  bio: {type: String, required: false},
  favorites: {type: ObjectId, ref: 'Playlists', required: true},
  recent: {type: ObjectId, ref: 'Playlists', required: true},
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  statics: {
    createNewUser: async (userName: string, email: string, pwdHash: string): Promise<SimpleUser> => {
      // Create default playlists first
      const favorites = await Playlists.createNewFavoritesPlaylist(null);
      const recent = await Playlists.createNewRecentPlaylist(null);

      // Create user
      const user = await Users.create({
        userName,
        nickName: userName,
        bio: '',
        avatarUrl: '',
        createdPlaylists: [],
        favorites: favorites._id,
        recent: recent._id,
      });
    
      // Update playlists with owner
      await Playlists.updateOne({ _id: favorites }, { owner: user._id });
      await Playlists.updateOne({ _id: recent }, { owner: user._id });
    
      // Create user auth
      await UserAuth.create({userId: user._id, email, pwdHash});

      const userData = user.toObject() as unknown as SimpleUser;
      userData._id = user._id.toString();
      return userData;
    },
    createNewOAuthUser: async (userName: string, nickName: string, email?: string, githubId?: string, googleId?: string, avatarUrl?: string): Promise<SimpleUser> => {
      // Create default playlists first
      const favorites = await Playlists.createNewFavoritesPlaylist(null);
      const recent = await Playlists.createNewRecentPlaylist(null);

      // Create user
      const user = await Users.create({
        userName,
        nickName: nickName || userName,
        bio: '',
        avatarUrl: avatarUrl || '',
        createdPlaylists: [],
        favorites: favorites._id,
        recent: recent._id,
      });
    
      // Update playlists with owner
      await Playlists.updateOne({ _id: favorites }, { owner: user._id });
      await Playlists.updateOne({ _id: recent }, { owner: user._id });
    
      // Create user auth for OAuth
      const authData: any = { userId: user._id };
      if (email) authData.email = email;
      if (githubId) authData.githubId = githubId;
      if (googleId) authData.googleId = googleId;
      
      await UserAuth.create(authData);

      const userData = user.toObject() as unknown as SimpleUser;
      userData._id = user._id.toString();
      return userData;
    },
    getSimpleUserInfo: async (userId: string): Promise<SimpleUser> => {
      const user = await Users.findById(userId)
        .select('-__v -createdPlaylists -favId -recentId -createdAt -updatedAt')
        .lean();
      if (!user) {
        throw new Error('User not found');
      }
      return user as unknown as SimpleUser;
    },
    getBasicUserInfo: async (userId: string): Promise<Omit<UserInfo, 'createdPlaylists' | 'favorites' | 'recent'>> => {
      const user = await Users.findById(userId)
        .select('-__v -createdPlaylists -favorites -recent -createdAt -updatedAt')
        .lean();
      if (!user) {
        throw new Error('User not found');
      }
      return user as unknown as Omit<UserInfo, 'createdPlaylists' | 'favorites' | 'recent'>;
    },
    getUserInfo: async (userId: string): Promise<UserInfo> => {
      const user = await Users.findById(userId)
        .populate({path: 'createdPlaylists', select: '_id name coverUrl isPublic'})
        .populate({path: 'favorites', select: 'coverUrl'})
        .populate({path: 'recent', select: 'coverUrl'})
        .select('-__v')
        .lean();
      if (!user) {
        throw new Error('User not found');
      }
      
      const userObject = user as any;
      if(userObject.favorites) {
        userObject.favorites.coverUrl = await Playlists.getLastSongCoverUrl(userObject.favorites._id);
      }
      if(userObject.recent) {
        userObject.recent.coverUrl = await Playlists.getLastSongCoverUrl(userObject.recent._id);
      }

      return userObject as UserInfo;
    },
    getUserPlaylists: async (userId: string): Promise<UserPlaylists> => {
      const userObj = await Users.getUserInfo(userId) as UserInfo;
      return {
        createdPlaylists: userObj.createdPlaylists,
        favorites: userObj.favorites,
        recent: userObj.recent
      };
    },
    createNewPlaylist: async (owner: ObjectId, name: string, description: string, coverUrl: string, isPublic: boolean): Promise<PlaylistDocument> => {
      const user = await Users.findById(owner);
      if (!user) {
        throw new Error('User not found');
      }
      const playlist = await Playlists.createNewPlaylist(owner, name, description, coverUrl, isPublic);
      user.createdPlaylists.push(playlist._id as unknown as ObjectId);
      await user.save();
      return playlist as unknown as PlaylistDocument;
    },
    deletePlaylist: async (owner: ObjectId, playlistId: ObjectId): Promise<void> => {
      const user = await Users.findById(owner);
      if (!user) {
        throw new Error('User not found');
      }
      
      const playlist = await Playlists.findById(playlistId);
      if (!playlist) {
        throw new Error('Playlist not found');
      }

      // Verify ownership
      if (playlist.owner?.toString() !== owner.toString()) {
        throw new Error('Unauthorized: User does not own this playlist');
      }

      // Delete cover image if it exists
      if (playlist.coverUrl) {
        try {
          await imageUploadService.deleteImage(playlist.coverUrl);
        } catch (error) {
          console.warn('Failed to delete playlist cover image:', error);
          // Continue with deletion even if cover deletion fails
        }
      }

      // Remove playlist from user's createdPlaylists array
      user.createdPlaylists.pull(playlistId);
      await user.save();

      // Delete the playlist from database
      await Playlists.findByIdAndDelete(playlistId);
    }
  }
});

const Users = mongoose.model('Users', userSchema);
export default Users;
