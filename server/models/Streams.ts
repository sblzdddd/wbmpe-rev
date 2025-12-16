import mongoose from "mongoose";
import { ObjectId } from "mongodb";

export type StreamDocument = {
  _id: ObjectId;
  songId: ObjectId;
  audio: {
    normal?: string;
    high?: string;
    lossless?: string;
  };
  video?: string;
} & TimeMetadata;

interface StreamModel extends mongoose.Model<StreamDocument> {
  getAllQualityUrls(songId: string): Promise<{ songId: string; audio: { normal: string | null; high: string | null; lossless: string | null }; video: string | null }>;
  parseSong(songId: string, taskId?: string, userId?: string): Promise<{ songId: string; audio: { normal: string | null; high: string | null; lossless: string | null }; video: string | null }>;
}

const streamsSchema = new mongoose.Schema({
  songId: {type: ObjectId, ref: 'Songs', required: true, unique: true},
  audio: {
    normal: {type: String, required: false},
    high: {type: String, required: false},
    lossless: {type: String, required: false}
  },
  video: {type: String, required: false}
}, {
  timestamps: true,
});

const Streams = mongoose.model<StreamDocument, StreamModel>('Streams', streamsSchema);

// Add static methods after model creation
Streams.getAllQualityUrls = async function(songId: string) {
  const stream = await this.findOne({ songId });
  return {
    songId: songId,
    audio: {
      normal: stream?.audio?.normal?.replace('cdn://', process.env.NUXT_IMAGE_ALIYUN_BASE_URL + '/') || null,
      high: stream?.audio?.high?.replace('cdn://', process.env.NUXT_IMAGE_ALIYUN_BASE_URL + '/') || null,
      lossless: stream?.audio?.lossless?.replace('cdn://', process.env.NUXT_IMAGE_ALIYUN_BASE_URL + '/') || null
    },
    video: stream?.video?.replace('cdn://', process.env.NUXT_IMAGE_ALIYUN_BASE_URL + '/') || null
  } 
};

export default Streams;