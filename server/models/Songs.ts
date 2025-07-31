import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import type { TimeMetadata } from '../../types/time_metadata';

export type SongDocument = {
  _id: ObjectId;
  addedBy: ObjectId;
  album: ObjectId;
  artists: ObjectId[];
  duration: number;
  name: string;
  src: string;
} & TimeMetadata;

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

const Songs = mongoose.model('Songs', SongSchema);
export default Songs;