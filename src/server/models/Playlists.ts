import mongoose from "mongoose";
import { ObjectId } from "mongodb";

import { createSongList } from "../utils/paginate";
import type { SongItem } from "~/types/song";
import type { Playlist } from "~/types/playlist";

const CollectionSongItemSchema = new mongoose.Schema({
  song: {type: ObjectId, ref: 'Songs', required: true, unique: true}
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const playlistsSchema = new mongoose.Schema({
  playlistType: {type: String, enum: ["playlist", "favorites", "recent"], required: true},
  name: {type: String, required: true},
  coverUrl: {type: String, required: false},
  description: {type: String, required: false},
  owner: {type: ObjectId, ref: 'Users'},
  songs: [CollectionSongItemSchema],
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const Playlists = mongoose.model('Playlists', playlistsSchema);
export default Playlists;

export async function findFullPlaylistData(playlistId: string, page: number = 1, limit: number = 1) {
  console.log("fetching playlist", playlistId, "page:", page, "limit:", limit)
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
    
    const songList = createSongList(playlist?.songs as unknown as SongItem[] || [], page, limit)

    if(playlist?.songs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (playlist as any).songs = undefined
    }

    
    // Return the playlist with paginated songs
    const result = JSON.parse(JSON.stringify({
      ...playlist,
      songList: songList
    })) as Playlist;
    // console.log("playlist info:", JSON.stringify(result, null, 2))
    
    return result;
  } catch (error) {
    console.error("Error fetching full playlist data:", error);
    throw error; // Re-throw the error so it can be caught by the caller
  }
};
