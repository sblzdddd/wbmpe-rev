import mongoose from "mongoose";
import { ObjectId } from "mongodb";

const streamsSchema = new mongoose.Schema({
  songId: {type: ObjectId, ref: 'Songs', required: true, unique: true},
  audio: {
    normal: {type: String, required: true},
    high: {type: String, required: false},
    lossless: {type: String, required: false}
  },
  video: {type: String, required: false}
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const Streams = mongoose.model('Streams', streamsSchema);
export default Streams;