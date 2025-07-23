/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import Playlists from "./Playlists";
import UserAuth from "./UserAuth";
import type { SimpleUser, UserInfo } from "../../types/User/User";
import Songs from "./Songs";

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
        .populate({path: 'createdPlaylists', select: '_id name coverUrl songs'})
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
      // get cover urls for playlists that don't have them
      const playlistsNeedingCovers = userObject.createdPlaylists.filter((p: any) => !p.coverUrl);

      const songIds = playlistsNeedingCovers
        .map((p: any) => p.songs?.[0]?.song)
        .filter(Boolean); // remove undefined

      // populate songs with album cover urls
      const songs = await Songs.find({ _id: { $in: songIds } })
        .select('_id album')
        .populate({ path: 'album', select: 'coverUrl' })
        .lean();

      // create map of song ids to album cover urls
      const songCoverMap = new Map(
        songs.map((song: any) => [song._id.toString(), song.album?.coverUrl || null])
      );

      // create map of playlist ids to cover urls
      const playlistsNeedingUpdate: Record<string, string> = {};

      // update playlists with cover urls
      const playlistsWithCovers = userObject.createdPlaylists.map((p: any) => {
        if (!p.coverUrl) {
          const firstSongId = p.songs?.[0]?.song?.toString();
          if (firstSongId && songCoverMap.has(firstSongId)) {
            p.coverUrl = songCoverMap.get(firstSongId);
            playlistsNeedingUpdate[p._id] = p.coverUrl;
          }
        }
        // remove songs field
        delete p.songs;
        return p;
      });
      
      userObject.createdPlaylists = playlistsWithCovers;

      // update playlists with cover urls so that they don't need to be populated again
      const ops = Object.keys(playlistsNeedingUpdate).map((id: string) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { coverUrl: playlistsNeedingUpdate[id] } }
        }
      }));
      await Playlists.bulkWrite(ops);

      return userObject;
    },
    getUserPlaylists: async (userId: string) => {
      const user = await Users.findById(userId)
        .populate({path: 'createdPlaylists', select: '_id name coverUrl songs'})
        .populate({path: 'favorites', select: 'coverUrl'})
        .populate({path: 'recent', select: 'coverUrl'})
        .select('createdPlaylists favorites recent')
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
      // get cover urls for playlists that don't have them
      const playlistsNeedingCovers = userObject.createdPlaylists.filter((p: any) => !p.coverUrl);

      const songIds = playlistsNeedingCovers
        .map((p: any) => p.songs?.[0]?.song)
        .filter(Boolean); // remove undefined

      // populate songs with album cover urls
      const songs = await Songs.find({ _id: { $in: songIds } })
        .select('_id album')
        .populate({ path: 'album', select: 'coverUrl' })
        .lean();

      // create map of song ids to album cover urls
      const songCoverMap = new Map(
        songs.map((song: any) => [song._id.toString(), song.album?.coverUrl || null])
      );

      // create map of playlist ids to cover urls
      const playlistsNeedingUpdate: Record<string, string> = {};

      // update playlists with cover urls
      const playlistsWithCovers = userObject.createdPlaylists.map((p: any) => {
        if (!p.coverUrl) {
          const firstSongId = p.songs?.[0]?.song?.toString();
          if (firstSongId && songCoverMap.has(firstSongId)) {
            p.coverUrl = songCoverMap.get(firstSongId);
            playlistsNeedingUpdate[p._id] = p.coverUrl;
          }
        }
        // remove songs field
        delete p.songs;
        return p;
      });
      
      userObject.createdPlaylists = playlistsWithCovers;

      // update playlists with cover urls so that they don't need to be populated again
      const ops = Object.keys(playlistsNeedingUpdate).map((id: string) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { coverUrl: playlistsNeedingUpdate[id] } }
        }
      }));
      await Playlists.bulkWrite(ops);

      return {
        createdPlaylists: userObject.createdPlaylists,
        favorites: userObject.favorites,
        recent: userObject.recent
      };
    }
  }
});

const Users = mongoose.model('Users', userSchema);
export default Users;
