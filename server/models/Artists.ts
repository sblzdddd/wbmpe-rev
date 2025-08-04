import mongoose from "mongoose";
import { ObjectId } from "mongodb";
const logger = BakaLogger.child({service: 'Artists'})

const CollectionSongItemSchema = new mongoose.Schema({
  song: {type: ObjectId, ref: 'Songs', required: true, unique: true}
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const artistsSchema = new mongoose.Schema({
  avatarUrl: {type: String, required: false},
  name: {type: String, required: true},
  description: {type: String, required: false},
  songs: [CollectionSongItemSchema],
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const Artists = mongoose.model('Artists', artistsSchema);
logger.debug('model loaded')
export default Artists;