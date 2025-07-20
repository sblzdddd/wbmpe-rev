import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import type { TimeMetadata } from "../../types/time_metadata";

export type CollectionSongItemDocument = {
  _id: string;
  song: ObjectId;
} & TimeMetadata

const CollectionSongItemSchema = new mongoose.Schema({
  song: {type: ObjectId, ref: 'Songs', required: true}
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

export default CollectionSongItemSchema;
