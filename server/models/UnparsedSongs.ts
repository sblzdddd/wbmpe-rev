import mongoose from 'mongoose';
import type { UnparsedSong, UnparsedSongWithoutId } from '#types/Search/UnparsedSongs';
import UnparsedEntitySchema from './UnparsedEntity';

export const UnparsedSongSchema = new mongoose.Schema({
  album: UnparsedEntitySchema,
  artists: [UnparsedEntitySchema],
  duration: {type: Number, required: true},
  name: {type: String, required: true},
  src: {type: String, required: true, unique: true},
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  statics: {
    async addSongs(songs: UnparsedSongWithoutId[]): Promise<UnparsedSong[]> {
      if (songs.length === 0) return []
      
      // Prepare bulk operations for upsert
      const bulkOps = songs.map(song => ({
        updateOne: {
          filter: { src: song.src },
          update: { $set: song },
          upsert: true
        }
      }))
      
      // Execute bulk write operation
      await this.bulkWrite(bulkOps)
      
      // Return the songs with their database IDs by finding them
      const srcs = songs.map(song => song.src)
      return await this.find({ src: { $in: srcs } }).lean() as unknown as UnparsedSong[]
    }
  }
});

const UnparsedSongs = mongoose.model('UnparsedSongs', UnparsedSongSchema);
export default UnparsedSongs;