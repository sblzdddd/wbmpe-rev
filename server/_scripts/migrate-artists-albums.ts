import mongoose from "mongoose";
import { MONGODB_URI } from "./baka";
import Artists from "../models/Artists";
import Albums from "../models/Albums";

await mongoose.connect(MONGODB_URI);
console.log('Connected to MongoDB');

const db = mongoose.connection;

// Helper function to convert old song data to new format
async function migrateArtistsAlbums() {
  const oldArtists = await db.collection('Artist').find({}).toArray();
  const oldAlbums = await db.collection('Album').find({}).toArray();
  for (const oldArtist of oldArtists) {
    const match = await Artists.findOne({name: oldArtist.name});
    if (!match) {
      console.log(`Artist ${oldArtist.name} does not exist`);
      continue;
    }
    match.externalId = oldArtist.aid || oldArtist._id || "";
    match.platform = 'netease';
    await match.save();
    console.log(`Artist ${oldArtist.name} migrated`);
  }
  for(const oldAlbum of oldAlbums) {
    const match = await Albums.findOne({name: oldAlbum.name});
    if (!match) {
      console.log(`Album ${oldAlbum.name} does not exist`);
      continue;
    }
    match.externalId = oldAlbum.aid || oldAlbum._id || "";
    match.platform = 'netease';
    await match.save();
    console.log(`Album ${oldAlbum.name} migrated`);
  }
}
try {

  await db.asPromise();

  await migrateArtistsAlbums();

} catch (error) {
  console.error('Error in main process:', error);
} finally {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}