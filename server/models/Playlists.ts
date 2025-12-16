/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model, Types, type Model } from "mongoose";
import type { CollectionSongItemDocument } from "./CollectionSongItem";
import CollectionSongItemSchema from "./CollectionSongItem";
const logger = BakaLogger.child({service: 'Playlists'})

export type Playlist = {
  playlistType: 'playlist' | 'favorites' | 'recent';
  _id: string;
  coverUrl: string;
  name: string;
  description: string;
  owner?: Types.ObjectId;
  songs: CollectionSongItemDocument[];
  isPublic: boolean;
} & TimeMetadata

export interface PlaylistsModel extends Model<Playlist> {
  hasReadAccess(playlistId: Types.ObjectId | string, userId: Types.ObjectId | string | null): Promise<boolean>;
  findFullPlaylistData(playlistId: Types.ObjectId | string): Promise<FullPlaylist>;
  createNewFavoritesPlaylist(owner?: Types.ObjectId | null): Promise<Playlist>;
  createNewRecentPlaylist(owner?: Types.ObjectId | null): Promise<Playlist>;
  createNewPlaylist(owner: Types.ObjectId, name: string, description: string, coverUrl: string, isPublic: boolean): Promise<Playlist>;
  getCreatedPlaylistInfo(playlistId: Types.ObjectId | string): Promise<PlaylistMeta>;
  getLastSongCoverUrl(playlistId: Types.ObjectId | string): Promise<string>;
}

const playlistsSchema = new Schema<Playlist, PlaylistsModel>({
  playlistType: {type: String, enum: ["playlist", "favorites", "recent"], required: true},
  name: {type: String, required: true},
  coverUrl: {type: String, required: false},
  description: {type: String, required: false},
  owner: { type: Schema.Types.ObjectId, ref: 'Users' },
  songs: [CollectionSongItemSchema],
  isPublic: {type: Boolean, required: true, default: false},
}, {
  timestamps: true,
  methods: {
  },
  statics: {
    async hasReadAccess(playlistId: Types.ObjectId | string, userId: Types.ObjectId | string | null): Promise<boolean> {
      const playlist = await Playlists.findById(playlistId)
      if(!playlist) {
        return false
      }
      return playlist.owner?.toString() === userId?.toString() || playlist.isPublic
    },
    async findFullPlaylistData(playlistId: Types.ObjectId | string): Promise<FullPlaylist> {
      try {
        // Get the playlist data
        const playlist = await Playlists.findById(playlistId)
          .populate({path: 'owner', select: 'userName nickName avatarUrl'})
          .populate({
            path: 'songs.song',
            select: '-createdAt -updatedAt -__v',
            populate: [
              { path: 'artists', select: 'name' },
              { path: 'album', select: 'name coverUrl' }
            ],
          })
          .select('-__v')
          .lean();
        if(playlist?.playlistType === 'favorites' && playlist.songs.length > 0) {
          (playlist as any).songs = [...playlist.songs].reverse()
        }
        const result = JSON.parse(JSON.stringify(playlist)) as unknown as FullPlaylist;
        
        return result;
      } catch (error) {
        logger.error("Error fetching full playlist data:", error);
        throw error;
      }
    },
    async createNewFavoritesPlaylist(owner: Types.ObjectId | null = null): Promise<Playlist> {
      const playlist = await Playlists.create({playlistType: 'favorites', name: 'Favorites', description: '', coverUrl: '', owner, songs: []})
      return playlist.toObject() as unknown as Playlist;
    },
    async createNewRecentPlaylist(owner: Types.ObjectId | null = null): Promise<Playlist> {
      const playlist = await Playlists.create({playlistType: 'recent', name: 'Recently Played', description: '', coverUrl: '', owner, songs: []})
      return playlist.toObject() as unknown as Playlist;
    },
    async createNewPlaylist(owner: Types.ObjectId, name: string, description: string, coverUrl: string, isPublic: boolean): Promise<Playlist> {
      const playlist = await Playlists.create({playlistType: 'playlist', name, description, coverUrl, owner, songs: [], isPublic})
      return playlist.toObject() as unknown as Playlist;
    },
    async getCreatedPlaylistInfo(playlistId: Types.ObjectId | string): Promise<PlaylistMeta> {
      const playlist = await Playlists.findById(playlistId)
        .select('-__v -songs -owner -description -createdAt -updatedAt')
        .lean();
      if (!playlist) {
        throw new Error('Playlist not found');
      }
      return playlist as unknown as PlaylistMeta;
    },
    async getLastSongCoverUrl(playlistId: Types.ObjectId | string): Promise<string> {
      const result = await Playlists.aggregate([
        { $match: { _id: new Types.ObjectId(playlistId as any) } },
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

const Playlists = model<Playlist, PlaylistsModel>('Playlists', playlistsSchema);
export default Playlists;
