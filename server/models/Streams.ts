import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { streamDownloader } from '../utils/stream_downloader';
import UnparsedSongs from './UnparsedSongs';
import Songs from './Songs';
import Albums from './Albums';
import Artists from './Artists';
const logger = BakaLogger.child({service: 'Streams'})

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
  timestamps: true, // Adds createdAt and updatedAt fields
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

Streams.parseSong = async function(songId: string, taskId?: string, userId?: string) {
  try {
    logger.info(`Starting song parsing for ID: ${songId}`);
    
    // Get the unparsed song record
    const unparsedSong = await UnparsedSongs.findById(songId);
    if (!unparsedSong) {
      throw new Error(`UnparsedSong with ID ${songId} not found`);
    }

    // Check if stream already exists
    const existingStream = await this.findOne({ songId: new ObjectId(songId) });
    if (existingStream) {
      logger.info(`Stream already exists for song ${songId}`);
      return await this.getAllQualityUrls(songId);
    }

    // Download and upload the stream
    const downloadResult = await streamDownloader.downloadAndUpload({
      url: unparsedSong.src,
      songId: songId,
      keepVideo: true,
      taskId: taskId,
      userId: userId
    });

    const audioResults = downloadResult.audio;
    const videoUploadResult = downloadResult.video;

    // Create or update Albums and Artists records
    const albumData = unparsedSong.album;
    const artistsData = unparsedSong.artists;

    if (!albumData) {
      throw new Error('Album data is missing from unparsed song');
    }

    logger.info(`creating album ${albumData.name}...`)

    // Create/update album using externalId
    const album = await Albums.findOrCreateByExternalId(albumData.id, {
      name: albumData.name,
      coverUrl: albumData.coverUrl || undefined,
      platform: albumData.platform,
    });

    logger.info(`creating artist(s) ${artistsData.map((artist) => artist.name).join(', ')}...`)

    // Create/update artists using externalId
    const artistIds = [];
    for (const artistData of artistsData) {
      const artist = await Artists.findOrCreateByExternalId(artistData.id, {
        name: artistData.name,
        platform: artistData.platform,
      });
      artistIds.push(artist._id);
    }

    // Create song record with auto-generated _id
    await Songs.create({
      _id: new ObjectId(songId),
      name: unparsedSong.name,
      duration: unparsedSong.duration,
      src: unparsedSong.src,
      album: album._id,
      artists: artistIds,
    });

    // Add song to album's songs array
    await Albums.addSongToAlbum(album._id, new ObjectId(songId));

    // Add song to each artist's songs array
    for (const artistId of artistIds) {
      await Artists.addSongToArtist(artistId, new ObjectId(songId));
    }

    // Create stream record
    const streamData = {
      songId: new ObjectId(songId),
      audio: {
        normal: audioResults.normal?.url,
        high: audioResults.high?.url,
        lossless: audioResults.lossless?.url,
      },
      video: videoUploadResult?.url || null,
    };

    await this.create(streamData);

    // Remove from UnparsedSongs
    await UnparsedSongs.findByIdAndDelete(songId);

    logger.info(`Successfully parsed song ${songId}`);
    
    // Return the stream URLs
    return await this.getAllQualityUrls(songId);
    
  } catch (error) {
    logger.error(`Failed to parse song ${songId}:`, error);
    throw error;
  }
};

export default Streams;