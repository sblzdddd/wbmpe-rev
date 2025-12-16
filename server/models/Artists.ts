import mongoose from "mongoose";
import type { ObjectId } from "mongodb";
import CollectionSongItemSchema from "./CollectionSongItem";
import BakaLogger from "../utils/logger/BakaLogger";

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
  timestamps: true,
});

const Artists = mongoose.model<ArtistDocument, ArtistModel>('Artists', artistsSchema);

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