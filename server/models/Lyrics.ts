import mongoose from "mongoose";
import { ObjectId } from "mongodb";

const lyricsSchema = new mongoose.Schema({
  songId: {type: ObjectId, ref: 'Songs', required: true, unique: true},
  lyrics: [{
    language: {type: String, required: true},
    content: {type: String, required: true},
    format: {type: String, required: true}
  }]
}, {
  timestamps: true,
});

const Lyrics = mongoose.model('Lyrics', lyricsSchema);
export default Lyrics;