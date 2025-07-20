/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { ObjectId } from "mongodb";

import type { FullPlaylist, PlaylistMeta } from "~/types/Playlist/";
import type { TimeMetadata } from "~/types/time_metadata";
import type { CollectionSongItemDocument } from "./CollectionSongItem";
import CollectionSongItemSchema from "./CollectionSongItem";

export type PlaylistDocument = {
  _id: string;
  coverUrl: string;
  name: string;
  description: string;
  owner: ObjectId;
  songs: CollectionSongItemDocument[];
} & TimeMetadata


const playlistsSchema = new mongoose.Schema({
  playlistType: {type: String, enum: ["playlist", "favorites", "recent"], required: true},
  name: {type: String, required: true},
  coverUrl: {type: String, required: false},
  description: {type: String, required: false},
  owner: {type: ObjectId, ref: 'Users'},
  songs: [CollectionSongItemSchema],
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  methods: {
  },
  statics: {
    async findFullPlaylistData(playlistId: string): Promise<FullPlaylist> {
      console.log("fetching playlist", playlistId)
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
          .select('-__v -songs._id')   // remote song item object id and playlist versioning
          .lean();
        
        // Return the playlist with paginated songs
        const result = JSON.parse(JSON.stringify(playlist)) as unknown as FullPlaylist;
        console.log("playlist info:", JSON.stringify(result, null, 2))
        
        return result;
      } catch (error) {
        console.error("Error fetching full playlist data:", error);
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
      if(coverUrl) {
        await Playlists.updateOne({ _id: playlistId }, { coverUrl });
      }
      return coverUrl;
    },
    async updatePlaylistCoverUrl(playlistId: string, coverUrl: string): Promise<void> {
      await Playlists.updateOne({ _id: playlistId }, { coverUrl });
    },
  }
});

const Playlists = mongoose.model('Playlists', playlistsSchema);
export default Playlists;
