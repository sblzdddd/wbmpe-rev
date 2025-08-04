import mongoose from "mongoose";
import { ObjectId } from "mongodb";
const logger = BakaLogger.child({service: 'CollectionSongItem'})

export type CollectionSongItemDocument = {
  _id: ObjectId;
  song: ObjectId;
} & TimeMetadata

export type CollectionSongItem = {
  _id: string;
  song: SongType;
} & TimeMetadata

const CollectionSongItemSchema = new mongoose.Schema({
  song: {type: ObjectId, ref: 'Songs', required: true}
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

logger.debug('model loaded')

export default CollectionSongItemSchema;
