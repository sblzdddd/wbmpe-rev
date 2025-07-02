import mongoose from "mongoose";
import { MONGODB_URI } from "./baka";
import { findFullPlaylistData } from "./models/Playlists";
import '~/server/models/Users';
import '~/server/models/UserAuth';
import '~/server/models/UserSubscriptions';
import '~/server/models/Songs';
import '~/server/models/Artists';
import '~/server/models/Albums';
import '~/server/models/Streams';
import '~/server/models/Lyrics';

await mongoose.connect(MONGODB_URI);
console.log('Connected to MongoDB');

const db = mongoose.connection;

try {

  await db.asPromise();
  
  await findFullPlaylistData("686354643eeb5905435b86de", 1, 20)

} catch (error) {
  console.error('Error in main process:', error);
} finally {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}