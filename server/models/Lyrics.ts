import mongoose from "mongoose";
import { ObjectId } from "mongodb";
const logger = BakaLogger.child({service: 'Lyrics'})

const lyricsSchema = new mongoose.Schema({
  songId: {type: ObjectId, ref: 'Songs', required: true, unique: true},
  lyrics: [{
    language: {type: String, required: true},
    content: {type: String, required: true},
    format: {type: String, required: true}
  }]
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const Lyrics = mongoose.model('Lyrics', lyricsSchema);
logger.debug('model loaded')
export default Lyrics;