/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import Playlists, { type Playlist } from "./Playlists";
import UserAuth from "./UserAuth";
import Songs from "./Songs";
import UserSubscriptions from "./UserSubscriptions";
const logger = BakaLogger.child({service: 'Users'})

export type UserDocument = {
  _id: ObjectId;
  bio: string|null;
  userName: string;
  nickName: string;
  avatarUrl: string;
  createdPlaylists: ObjectId[];
  favorites: ObjectId;
  recent: ObjectId;
  currentQueue?: {
    songs: SongType[];
    currentIndex: number;
    currentTime: number;
  };
}

const userSchema = new mongoose.Schema({
  avatarUrl: {type: String, required: false},
  createdPlaylists: [{type: ObjectId, ref: 'Playlists'}],
  userName: {type: String, required: true, unique: true},
  nickName: {type: String, required: false},
  bio: {type: String, required: false},
  favorites: {type: ObjectId, ref: 'Playlists', required: true},
  recent: {type: ObjectId, ref: 'Playlists', required: true},
  currentQueue: {
    songs: [{type: ObjectId, ref: 'Songs'}],
    currentIndex: {type: Number, default: 0},
    currentTime: {type: Number, default: 0}
  }
}, {
  timestamps: true,
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
    
      await Playlists.updateOne({ _id: favorites }, { owner: user._id });
      await Playlists.updateOne({ _id: recent }, { owner: user._id });
    
      await UserAuth.create({userId: user._id, email, pwdHash});

      const userData = user.toObject() as unknown as SimpleUser;
      userData._id = user._id.toString();
      return userData;
    },
    createNewOAuthUser: async (userName: string, nickName: string, email?: string, githubId?: string, googleId?: string, avatarUrl?: string): Promise<SimpleUser> => {
      const favorites = await Playlists.createNewFavoritesPlaylist(null);
      const recent = await Playlists.createNewRecentPlaylist(null);

      const user = await Users.create({
        userName,
        nickName: nickName || userName,
        bio: '',
        avatarUrl: avatarUrl || '',
        createdPlaylists: [],
        favorites: favorites._id,
        recent: recent._id,
      });
    
      await Playlists.updateOne({ _id: favorites }, { owner: user._id });
      await Playlists.updateOne({ _id: recent }, { owner: user._id });
    
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
      
      // Fetch subscriptions
      const subscriptions = await UserSubscriptions.findOne({ userId: user._id })
        .populate({path: 'subscribed_playlists.playlist', select: 'name coverUrl isPublic'})
        .populate({path: 'subscribed_artists.artist', select: 'name avatarUrl'})
        .populate({path: 'subscribed_albums.album', select: 'name coverUrl'})
        .lean();

      if (subscriptions) {
        userObject.subscribedPlaylists = subscriptions.subscribed_playlists.map((item: any) => item.playlist);
        userObject.subscribedArtists = subscriptions.subscribed_artists.map((item: any) => item.artist);
        userObject.subscribedAlbums = subscriptions.subscribed_albums.map((item: any) => item.album);
      } else {
        userObject.subscribedPlaylists = [];
        userObject.subscribedArtists = [];
        userObject.subscribedAlbums = [];
      }

      if(userObject.favorites) {
        userObject.favorites.coverUrl = await Playlists.getLastSongCoverUrl(userObject.favorites._id);
      }
      if(userObject.recent) {
        userObject.recent.coverUrl = await Playlists.getLastSongCoverUrl(userObject.recent._id);
      }

      return userObject as UserInfo;
    },
    getFavoriteSongIds: async (userId: string): Promise<string[]> => {
      const user = await Users.findById(userId)
        .populate({path: 'favorites', select: 'songs'})
        .select('favorites')
        .lean();
// oxlint-disable-next-line no-unsafe-optional-chaining
      return (user?.favorites as {songs: {song: string}[]}).songs.map((song: any) => song.song) ?? [];
    },
    setFavoriteSong: async (userId: ObjectId, songId: ObjectId, set: boolean): Promise<void> => {
      const user = await Users.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      const playlist = await Playlists.findById(user.favorites);
      if (!playlist) {
        throw new Error('Playlist not found');
      }
      const song = await Songs.findById(songId);
      if (!song) {
        throw new Error('Song not found');
      }
      if (set) {
        playlist.songs.push({ _id: new mongoose.Types.ObjectId(), owner: user._id, song: song._id });
      } else {
        playlist.songs = playlist.songs.filter(
          (item: any) => !(item.owner.equals(user._id) && item.song.equals(song._id))
        );
      }
      await playlist.save();
    },
    getUserPlaylists: async (userId: string): Promise<UserPlaylists> => {
      const userObj = await Users.getUserInfo(userId) as UserInfo;
      return {
        createdPlaylists: userObj.createdPlaylists,
        favorites: userObj.favorites,
        recent: userObj.recent
      };
    },
    createNewPlaylist: async (owner: ObjectId, name: string, description: string, coverUrl: string, isPublic: boolean): Promise<Playlist> => {
      const user = await Users.findById(owner);
      if (!user) {
        throw new Error('User not found');
      }
      const playlist = await Playlists.createNewPlaylist(owner, name, description, coverUrl, isPublic);
      user.createdPlaylists.push(playlist._id as unknown as ObjectId);
      await user.save();
      return playlist;
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

      // Remove playlist from user's createdPlaylists array
      user.createdPlaylists.pull(playlistId);
      await user.save();

      // Delete the playlist from database
      await Playlists.findByIdAndDelete(playlistId);
    },
    updateUserQueue: async (userId: string, songs: { songId: ObjectId }[] | undefined, currentIndex: number | undefined, currentTime: number | undefined): Promise<void> => {
      const user = await Users.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const userObj = user as unknown as UserDocument;

      user.currentQueue = {
        songs: songs?.map(song => song.songId) ?? userObj.currentQueue?.songs ?? [],
        currentIndex: currentIndex ?? userObj.currentQueue?.currentIndex ?? 0,
        currentTime: currentTime ?? userObj.currentQueue?.currentTime ?? 0
      };

      await user.save();
    },
    getUserQueue: async (userId: string): Promise<{ songs: SongType[]; currentIndex: number; currentTime: number }> => {
      const user = await Users.findById(userId)
        .populate({
          path: 'currentQueue.songs',
          populate: [
            { path: 'album', select: 'name coverUrl' },
            { path: 'artists', select: 'name' }
          ]
        })
        .lean();
        
      if (!user || !user.currentQueue) {
        logger.error('User not found or currentQueue not found');
        return { songs: [], currentIndex: 0, currentTime: 0 };
      }

      const userObj = user as unknown as UserDocument;
      if(!userObj.currentQueue) {
        logger.error('User currentQueue not found');
        return { songs: [], currentIndex: 0, currentTime: 0 };
      }

      const populatedQueue = userObj.currentQueue.songs;

      return {
        songs: populatedQueue,
        currentIndex: userObj.currentQueue.currentIndex,
        currentTime: userObj.currentQueue.currentTime
      };
    }
  }
});

const Users = mongoose.model('Users', userSchema);
export default Users;
