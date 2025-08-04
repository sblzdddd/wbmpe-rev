import mongoose from "mongoose";
import { ObjectId } from "mongodb";
const logger = BakaLogger.child({service: 'Streams'})
const streamsSchema = new mongoose.Schema({
  songId: {type: ObjectId, ref: 'Songs', required: true, unique: true},
  audio: {
    normal: {type: String, required: false},
    high: {type: String, required: false},
    lossless: {type: String, required: false}
  },
  video: {type: String, required: false}
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  statics: {
    getAllQualityUrls: async (songId: string): Promise<{ songId: string; audio: { normal: string | null; high: string | null; lossless: string | null }; video: string | null }> => {
      const stream = await Streams.findOne({ songId });
      return {
        songId: songId,
        audio: {
          normal: stream?.audio?.normal?.replace('cdn://', process.env.NUXT_IMAGE_ALIYUN_BASE_URL + '/') || null,
            high: stream?.audio?.high?.replace('cdn://', process.env.NUXT_IMAGE_ALIYUN_BASE_URL + '/') || null,
            lossless: stream?.audio?.lossless?.replace('cdn://', process.env.NUXT_IMAGE_ALIYUN_BASE_URL + '/') || null
        },
        video: stream?.video?.replace('cdn://', process.env.NUXT_IMAGE_ALIYUN_BASE_URL + '/') || null
      } 
    }
  }
});

const Streams = mongoose.model('Streams', streamsSchema);
logger.debug('model loaded')
export default Streams;