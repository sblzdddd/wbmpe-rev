import mongoose from "mongoose";
import type { ObjectId } from "mongodb";
import CollectionSongItemSchema from "./CollectionSongItem";
import BakaLogger from "../utils/logger/BakaLogger";
import { getSingerInfo, searchSinger } from "../utils/netease_artist";

const logger = BakaLogger.child({service: 'Artists'})

export interface ArtistDocument extends mongoose.Document {
  _id: ObjectId;
  externalId: string;
  name: string;
  avatarUrl?: string;
  description?: string;
  songs: Array<{ _id: ObjectId; song: ObjectId; }>;
  platform?: string;
}

interface ArtistModel extends mongoose.Model<ArtistDocument> {
  findOrCreateByExternalId(externalId: string, artistData: {
    name: string;
    avatarUrl?: string;
    platform?: string;
    description?: string;
  }): Promise<ArtistDocument>;
  addSongToArtist(artistId: ObjectId, songId: ObjectId): Promise<void>;
}

const artistsSchema = new mongoose.Schema({
  externalId: {type: String, required: false, unique: true, index: true},
  avatarUrl: {type: String, required: false},
  name: {type: String, required: true},
  description: {type: String, required: false},
  songs: [CollectionSongItemSchema],
  platform: {type: String, required: false, default: 'local'},
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const Artists = mongoose.model<ArtistDocument, ArtistModel>('Artists', artistsSchema);

// Add static methods after model creation
Artists.findOrCreateByExternalId = async function(externalId: string, artistData: {
  name: string;
  avatarUrl?: string;
  platform?: string;
  description?: string;
}): Promise<ArtistDocument> {
  try {
    // Try to find existing artist by externalId
    let artist = await this.findOne({ platform: artistData.platform || 'local', externalId });
    if(!artist) artist = await this.findOne({ name: artistData.name });
    
    if (!artist) {
      const { description, avatarUrl } = artistData.platform === 'netease' ? await getSingerInfo(externalId) : await searchSinger(artistData.name);
      // Create new artist if not found
      artist = await this.create({
        externalId,
        name: artistData.name,
        avatarUrl,
        platform: artistData.platform,
        description,
        songs: []
      });
      logger.info(`Created new artist with externalId: ${externalId}`);
    } else {
      // Update existing artist with new data if provided
      const updates: Partial<typeof artistData> = {};
      if (artistData.name && artist.name !== artistData.name) updates.name = artistData.name;
      if (artistData.avatarUrl && artist.avatarUrl !== artistData.avatarUrl) updates.avatarUrl = artistData.avatarUrl;
      if (artistData.platform && artist.platform !== artistData.platform) updates.platform = artistData.platform;
      if (artistData.description && artist.description !== artistData.description) updates.description = artistData.description;
      
      if (Object.keys(updates).length > 0) {
        const updatedArtist = await this.findOneAndUpdate(
          { externalId },
          { $set: updates },
          { new: true }
        );
        if (updatedArtist) {
          artist = updatedArtist;
          logger.info(`Updated artist with externalId: ${externalId}`);
        }
      }
    }
    
    return artist;
  } catch (error) {
    logger.error(`Error finding or creating artist with externalId ${externalId}:`, error);
    throw error;
  }
};

Artists.addSongToArtist = async function(artistId: ObjectId, songId: ObjectId): Promise<void> {
  try {
    await this.findByIdAndUpdate(artistId, {
      $addToSet: { songs: { song: songId } }
    });
    logger.debug(`Added song ${songId} to artist ${artistId}`);
  } catch (error) {
    logger.error(`Error adding song ${songId} to artist ${artistId}:`, error);
    throw error;
  }
};

export default Artists;