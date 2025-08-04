/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import type { CollectionSongItemDocument } from "./CollectionSongItem";
import CollectionSongItemSchema from "./CollectionSongItem";
const logger = BakaLogger.child({service: 'Playlists'})

export type PlaylistDocument = {
  _id: string;
  coverUrl: string;
  name: string;
  description: string;
  owner: ObjectId;
  songs: CollectionSongItemDocument[];
  isPublic: boolean;
} & TimeMetadata


const playlistsSchema = new mongoose.Schema({
  playlistType: {type: String, enum: ["playlist", "favorites", "recent"], required: true},
  name: {type: String, required: true},
  coverUrl: {type: String, required: false},
  description: {type: String, required: false},
  owner: {type: ObjectId, ref: 'Users'},
  songs: [CollectionSongItemSchema],
  isPublic: {type: Boolean, required: true, default: false},
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  methods: {
  },
  statics: {
    async hasReadAccess(playlistId: string, userId: string|null): Promise<boolean> {
      const playlist = await Playlists.findById(playlistId)
      if(!playlist) {
        return false
      }
      return playlist.owner?.toString() === userId || playlist.isPublic
    },
    async findFullPlaylistData(playlistId: string): Promise<FullPlaylist> {
      try {
        // Get the playlist data
        const playlist = await Playlists.findById(playlistId)
          .populate({path: 'owner', select: 'userName nickName avatarUrl'})
          .populate({
            path: 'songs.song',
            select: '-createdAt -updatedAt -__v',
            populate: [
              { path: 'artists', select: 'name' },  // add artist name (with _id)
              { path: 'album', select: 'name coverUrl' }  // add album name (with _id)
            ],
          })
          .select('-__v')   // remote song item object id and playlist versioning
          .lean();
        if(playlist?.playlistType === 'favorites' && playlist.songs.length > 0) {
          // revert the list
          (playlist as any).songs = [...playlist.songs].reverse()
        }
        // Return the playlist with paginated songs
        const result = JSON.parse(JSON.stringify(playlist)) as unknown as FullPlaylist;
        
        return result;
      } catch (error) {
        logger.error("Error fetching full playlist data:", error);
        throw error; // Re-throw the error so it can be caught by the caller
      }
    },
    async createNewFavoritesPlaylist(owner: ObjectId|null=null): Promise<PlaylistDocument> {
      const playlist = await Playlists.create({playlistType: 'favorites', name: 'Favorites', description: '', coverUrl: '', owner, songs: []})
      return playlist.toObject() as unknown as PlaylistDocument;
    },
    async createNewRecentPlaylist(owner: ObjectId|null=null): Promise<PlaylistDocument> {
      const playlist = await Playlists.create({playlistType: 'recent', name: 'Recently Played', description: '', coverUrl: '', owner, songs: []})
      return playlist.toObject() as unknown as PlaylistDocument;
    },
    async createNewPlaylist(owner: ObjectId, name: string, description: string, coverUrl: string, isPublic: boolean): Promise<PlaylistDocument> {
      const playlist = await Playlists.create({playlistType: 'playlist', name, description, coverUrl, owner, songs: [], isPublic})
      return playlist.toObject() as unknown as PlaylistDocument;
    },
    async getCreatedPlaylistInfo(playlistId: string): Promise<PlaylistMeta> {
      const playlist = await Playlists.findById(playlistId)
        .select('-__v -songs -owner -description -createdAt -updatedAt')
        .lean();
      if (!playlist) {
        throw new Error('Playlist not found');
      }
      return playlist as unknown as PlaylistMeta;
    },
    async getLastSongCoverUrl(playlistId: string): Promise<string> {
      const result = await Playlists.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(playlistId) } },
        { $project: { firstSongId: { $arrayElemAt: ['$songs.song', 0] } } },
        {
          $lookup: {
            from: 'songs',
            localField: 'firstSongId',
            foreignField: '_id',
            as: 'firstSong'
          }
        },
        { $unwind: '$firstSong' },
        {
          $lookup: {
            from: 'albums',
            localField: 'firstSong.album',
            foreignField: '_id',
            as: 'album'
          }
        },
        { $unwind: '$album' },
        { $project: { coverUrl: '$album.coverUrl' } }
      ]);
      
      const coverUrl = result[0]?.coverUrl;
      return coverUrl;
    },
  }
});

const Playlists = mongoose.model('Playlists', playlistsSchema);
logger.debug('model loaded')
export default Playlists;
