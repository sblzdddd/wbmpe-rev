import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import CollectionSongItemSchema from "./CollectionSongItem";

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
