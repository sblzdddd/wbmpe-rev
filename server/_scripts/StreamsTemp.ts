import mongoose from "mongoose";
import { ObjectId } from "mongodb";

const streamsTempSchema = new mongoose.Schema({
  songId: {type: ObjectId, ref: 'Songs', required: true, unique: true},
  audio: {
    normal: {type: String, required: false},
    high: {type: String, required: false},
    lossless: {type: String, required: false}
  },
  video: {type: String, required: false}
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const Streams_Temp = mongoose.model('Streams_Temp', streamsTempSchema);
export default Streams_Temp;