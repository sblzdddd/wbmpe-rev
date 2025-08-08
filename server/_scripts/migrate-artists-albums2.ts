/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import type { ObjectId } from "mongodb";
import { MONGODB_URI } from "./baka";
import Artists from "../models/Artists";
import Albums from "../models/Albums";
import Songs from "../models/Songs";

await mongoose.connect(MONGODB_URI);
console.log('Connected to MongoDB');

const db = mongoose.connection;

// Helper function to convert old song data to new format
async function migrateArtistsAlbums() {
  const allSongs = await Songs.find({}).exec();
  const artists = new Set<string>();
  const albums = new Set<string>();
  for(const song of allSongs) {
    // find artists by ids
    const artistDocs = await Artists.find({_id: {$in: song.artists}}).exec();
    for(const artist of artistDocs) {
      artists.add(artist._id.toString());
    }
    const album = await Albums.findOne({_id: song.album}).exec();
    if (!album) {
      console.warn(`Album ${song.album} does not exist`);
      continue;
    }
    albums.add(album._id.toString());
  }
  console.log(`Found ${artists.size} artists and ${albums.size} albums`);
  // delete unused artists and albums
  await Artists.deleteMany({_id: {$nin: Array.from(artists)}}).exec();
  await Albums.deleteMany({_id: {$nin: Array.from(albums)}}).exec();
}

async function removeDuplication() {
  const allArtists = await Artists.find({}).exec();
  const duplicates = new Map<string, ObjectId>();
  for(const artist of allArtists) {
    if(duplicates.has(artist.name)) {
      const originalObjId = artist._id;
      const objId = duplicates.get(artist.name);
      const songs = await Songs.find({artists: originalObjId}).exec();
      for(const song of songs) {
        song.artists = song.artists.map((id) => id.toString() === originalObjId.toString() ? objId : id) as ObjectId[];
        await song.save();
      }
      await Artists.deleteOne({_id: artist._id}).exec();
    } else {
      duplicates.set(artist.name, artist._id);
    }
  }
  console.log(`Found ${duplicates.size} duplicates`);
}
try {

  await db.asPromise();

  // await migrateArtistsAlbums();
  await removeDuplication();

} catch (error) {
  console.error('Error in main process:', error);
} finally {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}