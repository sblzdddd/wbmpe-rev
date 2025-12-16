import mongoose from "mongoose";
import { ObjectId } from "mongodb";

export type CollectionSongItemDocument = {
  _id: ObjectId;
  owner: ObjectId;
  song: ObjectId;
} & TimeMetadata

export type CollectionSongItem = {
  _id: string;
  owner: string;
  song: SongType;
} & TimeMetadata

const CollectionSongItemSchema = new mongoose.Schema({
  song: {type: ObjectId, ref: 'Songs', required: true}
}, {
  timestamps: true,
});

export default CollectionSongItemSchema;
