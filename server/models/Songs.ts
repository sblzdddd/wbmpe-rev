import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import BakaLogger from '../utils/logger/BakaLogger';

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
  searchMultipleFullInfo(keyword: string): Promise<SongType[]>;
  getAllSongs(page?: number, limit?: number): Promise<{ songs: SongType[]; total: number; }>;
}

export const SongSchema = new mongoose.Schema({
  addedBy: {type: ObjectId, ref: 'Users', required: false},
  album: {type: ObjectId, ref: 'Albums', required: true},
  artists: [{type: ObjectId, ref: 'Artists'}],
  duration: {type: Number, required: true},
  name: {type: String, required: true},
  src: {type: String, required: true, unique: true},
}, {
  timestamps: true,
});

const Songs = mongoose.model<SongDocument, SongModel>('Songs', SongSchema);

// Add static method after model creation
Songs.getMultipleFullInfo = async function(srcs: string[]): Promise<SongType[]> {
  const songs = await this.find({ src: { $in: srcs } }).populate('album').populate('artists').lean()
  return songs as unknown as SongType[]
}
Songs.searchMultipleFullInfo = async function(keyword: string): Promise<SongType[]> {
  const songs = await this.find({ name: { $regex: keyword, $options: 'i' } })
  .populate({path: 'album', select: '-songs'})
  .populate({path: 'artists', select: '-songs'})
  .select('-__v -createdAt -updatedAt')
  .lean()
  return songs as unknown as SongType[]
}

Songs.getAllSongs = async function(page: number = 1, limit: number = 100): Promise<{ songs: SongType[]; total: number; }> {
  try {
    const skip = (page - 1) * limit;
    
    const songs = await this.find({})
      .populate({path: 'album', select: 'name coverUrl platform'})
      .populate({path: 'artists', select: 'name avatarUrl platform'})
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.countDocuments({});

    return { songs: songs as unknown as SongType[], total };
  } catch (error) {
    logger.error("Error fetching songs list:", error);
    throw error;
  }
};
export default Songs;