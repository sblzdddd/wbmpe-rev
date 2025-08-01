import mongoose from "mongoose";
import { MONGODB_URI } from "./baka";
import "../models"
import Songs from "../models/Songs";
import Albums from "../models/Albums";

await mongoose.connect(MONGODB_URI);
console.log('Connected to MongoDB');

const db = mongoose.connection;

const purgeUnused = async () => {
  const allSongs = await Songs.find({});
  const refAlbums = new Set(allSongs.map(song => song.album?.toString()));
  const allAlbums = await Albums.find({});
  const unusedAlbums = allAlbums.filter(album => !refAlbums.has(album._id.toString()));
  await Albums.deleteMany({ _id: { $in: unusedAlbums.map(album => album._id) } });
  console.log(`Purged ${unusedAlbums.length} unused albums`);
}

try {
  await purgeUnused();
  await db.asPromise();

} catch (error) {
  console.error('Error in main process:', error);
} finally {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}