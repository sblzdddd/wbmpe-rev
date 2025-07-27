import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import type { TimeMetadata } from "../../types/time_metadata";
import type { Song } from "#types/Song";

export type CollectionSongItemDocument = {
  _id: ObjectId;
  song: ObjectId;
} & TimeMetadata

export type CollectionSongItem = {
  _id: string;
  song: Song;
} & TimeMetadata

const CollectionSongItemSchema = new mongoose.Schema({
  song: {type: ObjectId, ref: 'Songs', required: true}
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

export default CollectionSongItemSchema;
