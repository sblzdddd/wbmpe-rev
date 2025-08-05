import mongoose from 'mongoose';
import UnparsedEntitySchema from './UnparsedEntity';
const logger = BakaLogger.child({service: 'UnparsedSongs'})
export const UnparsedSongSchema = new mongoose.Schema({
  album: UnparsedEntitySchema,
  artists: [UnparsedEntitySchema],
  duration: {type: Number, required: true},
  name: {type: String, required: true},
  src: {type: String, required: true, unique: true},
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  statics: {
    async addSongs(songs: UnparsedSongWithoutId[]): Promise<UnparsedSongType[]> {
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
      const unparsedSongs = await this.find({ src: { $in: srcs } })
      .select('-__v -createdAt -updatedAt -album._id -artists._id -artists.createdAt -artists.updatedAt -album.createdAt -album.updatedAt')
      .lean()
      return unparsedSongs as unknown as UnparsedSongType[]
    }
  }
});

const UnparsedSongs = mongoose.model('UnparsedSongs', UnparsedSongSchema);
logger.debug('model loaded')
export default UnparsedSongs;