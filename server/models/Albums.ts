import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import CollectionSongItemSchema from "./CollectionSongItem";
import BakaLogger from "../utils/logger/BakaLogger";
import { getAlbumInfo, searchAlbum } from "../utils/netease_album";
import type { FullAlbum, SimpleAlbum } from "#types/Album";

const logger = BakaLogger.child({service: 'Albums'})

export interface AlbumDocument extends mongoose.Document {
  _id: ObjectId;
  externalId: string;
  name: string;
  coverUrl?: string;
  description?: string;
  artists: ObjectId[];
  songs: Array<{ _id: ObjectId; song: ObjectId; }>;
  platform: string;
  createdAt: string;
  updatedAt: string;
}

interface AlbumModel extends mongoose.Model<AlbumDocument> {
  findOrCreateByExternalId(externalId: string, albumData: {
    name: string;
    coverUrl?: string;
    platform?: string;
    description?: string;
  }): Promise<AlbumDocument>;
  addSongToAlbum(albumId: ObjectId, songId: ObjectId): Promise<void>;
  findFullAlbumData(albumId: ObjectId): Promise<FullAlbum>;
  getAllAlbums(page: number, limit: number): Promise<{ albums: SimpleAlbum[]; total: number; }>;
  updateAlbum(albumId: ObjectId, updateData: Partial<AlbumDocument>): Promise<AlbumDocument>;
  deleteAlbum(albumId: ObjectId): Promise<void>;
}

const albumsSchema = new mongoose.Schema({
  externalId: {type: String, required: false, unique: true, index: true},
  name: {type: String, required: true},
  coverUrl: {type: String, required: false},
  description: {type: String, required: false},
  artists: [{type: ObjectId, ref: 'Artists'}],
  songs: [CollectionSongItemSchema],
  platform: {type: String, required: false, default: 'local'},
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const Albums = mongoose.model<AlbumDocument, AlbumModel>('Albums', albumsSchema);

// Add static methods after model creation
Albums.findOrCreateByExternalId = async function(externalId: string, albumData: {
  name: string;
  coverUrl?: string;
  platform?: string;
  description?: string;
}): Promise<AlbumDocument> {
  try {
    // Try to find existing album by externalId
    let album = await this.findOne({ platform: albumData.platform || 'local', externalId });
    if(!album) album = await this.findOne({ name: albumData.name });
    
    if (!album) {
      const { description, coverUrl } = albumData.platform === 'netease' ? await getAlbumInfo(externalId, albumData.name) : await searchAlbum(albumData.name);
      // Create new album if not found
      album = await this.create({
        externalId,
        name: albumData.name,
        coverUrl,
        platform: albumData.platform,
        description,
        artists: [],
        songs: []
      });
      logger.info(`Created new album with externalId: ${externalId}`);
    } else {
      // Update existing album with new data if provided
      const updates: Partial<typeof albumData> = {};
      if (albumData.name && album.name !== albumData.name) updates.name = albumData.name;
      if (albumData.coverUrl && album.coverUrl !== albumData.coverUrl) updates.coverUrl = albumData.coverUrl;
      if (albumData.platform && album.platform !== albumData.platform) updates.platform = albumData.platform;
      if (albumData.description && album.description !== albumData.description) updates.description = albumData.description;
      
      if (Object.keys(updates).length > 0) {
        const updatedAlbum = await this.findOneAndUpdate(
          { externalId },
          { $set: updates },
          { new: true }
        );
        if (updatedAlbum) {
          album = updatedAlbum;
          logger.info(`Updated album with externalId: ${externalId}`);
        }
      }
    }
    
    return album;
  } catch (error) {
    logger.error(`Error finding or creating album with externalId ${externalId}:`, error);
    throw error;
  }
};

Albums.addSongToAlbum = async function(albumId: ObjectId, songId: ObjectId): Promise<void> {
  try {
    await this.findByIdAndUpdate(albumId, {
      $addToSet: { songs: { song: songId } }
    });
    logger.debug(`Added song ${songId} to album ${albumId}`);
  } catch (error) {
    logger.error(`Error adding song ${songId} to album ${albumId}:`, error);
    throw error;
  }
};

Albums.findFullAlbumData = async function(albumId: ObjectId): Promise<FullAlbum> {
  try {
    // Get the album data with populated artists and songs
    const album = await this.findById(albumId)
      .populate({path: 'artists', select: 'name avatarUrl'})
      .populate({
        path: 'songs.song',
        select: '-createdAt -updatedAt -__v',
        populate: [
          { path: 'artists', select: 'name avatarUrl' },
          { path: 'album', select: 'name coverUrl' }
        ],
      })
      .select('-__v')
      .lean();
    
    if (!album) {
      throw new Error('Album not found');
    }

    // Return the album data
    const result = JSON.parse(JSON.stringify(album)) as unknown as FullAlbum;
    return result;
  } catch (error) {
    logger.error("Error fetching full album data:", error);
    throw error;
  }
};

Albums.getAllAlbums = async function(page: number = 1, limit: number = 100): Promise<{ albums: SimpleAlbum[]; total: number; }> {
  try {
    const skip = (page - 1) * limit;
    
    // Get albums with basic info
    const albums = await this.find({})
      .populate({path: 'artists', select: 'name'})
      .select('name coverUrl platform createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await this.countDocuments({});

    // Transform to SimpleAlbum format
    const simpleAlbums: SimpleAlbum[] = albums.map(album => ({
      _id: album._id.toString(),
      name: album.name,
      coverUrl: album.coverUrl || '',
      platform: album.platform,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt
    }));

    return { albums: simpleAlbums, total };
  } catch (error) {
    logger.error("Error fetching albums list:", error);
    throw error;
  }
};

Albums.updateAlbum = async function(albumId: ObjectId, updateData: Partial<AlbumDocument>): Promise<AlbumDocument> {
  try {
    const updatedAlbum = await this.findByIdAndUpdate(
      albumId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedAlbum) {
      throw new Error('Album not found');
    }
    
    logger.info(`Updated album ${albumId}`);
    return updatedAlbum;
  } catch (error) {
    logger.error(`Error updating album ${albumId}:`, error);
    throw error;
  }
};

Albums.deleteAlbum = async function(albumId: ObjectId): Promise<void> {
  try {
    const result = await this.findByIdAndDelete(albumId);
    if (!result) {
      throw new Error('Album not found');
    }
    logger.info(`Deleted album ${albumId}`);
  } catch (error) {
    logger.error(`Error deleting album ${albumId}:`, error);
    throw error;
  }
};

export default Albums;

