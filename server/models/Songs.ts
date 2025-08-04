import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
const logger = BakaLogger.child({service: 'Songs'})

export type SongDocument = {
  _id: ObjectId;
  addedBy: ObjectId;
  album: ObjectId;
  artists: ObjectId[];
  duration: number;
  name: string;
  src: string;
} & TimeMetadata;

interface SongModel extends mongoose.Model<SongDocument> {
  getMultipleFullInfo(srcs: string[]): Promise<SongType[]>;
}

export const SongSchema = new mongoose.Schema({
  addedBy: {type: ObjectId, ref: 'Users', required: false},   // userId
  album: {type: ObjectId, ref: 'Albums', required: true},   // albumId
  artists: [{type: ObjectId, ref: 'Artists'}],   // artistIds
  duration: {type: Number, required: true},
  name: {type: String, required: true},
  src: {type: String, required: true, unique: true},
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const Songs = mongoose.model<SongDocument, SongModel>('Songs', SongSchema);

// Add static method after model creation
Songs.getMultipleFullInfo = async function(srcs: string[]): Promise<SongType[]> {
  const songs = await this.find({ src: { $in: srcs } }).populate('album').populate('artists').lean()
  return songs as unknown as SongType[]
}
logger.debug('model loaded')
export default Songs;