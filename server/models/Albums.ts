import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import CollectionSongItemSchema from "./CollectionSongItem";
const logger = BakaLogger.child({service: 'Albums'})

const albumsSchema = new mongoose.Schema({
  name: {type: String, required: true},
  coverUrl: {type: String, required: false},
  description: {type: String, required: false},
  artists: [{type: ObjectId, ref: 'Artists'}],
  songs: [CollectionSongItemSchema],
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const Albums = mongoose.model('Albums', albumsSchema);
logger.debug('model loaded')
export default Albums;

