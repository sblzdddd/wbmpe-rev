import mongoose from "mongoose";
import { ObjectId } from "mongodb";

const CollectionSongItemSchema = new mongoose.Schema({
  song: {type: ObjectId, ref: 'Songs', required: true, unique: true}
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

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
export default Albums;
