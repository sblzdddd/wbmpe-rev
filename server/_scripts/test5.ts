import mongoose from "mongoose";
import { MONGODB_URI } from "./baka";
import '#models/UserAuth';
import '#models/UserSubscriptions';
import '#models/Songs';
import '#models/Artists';
import '#models/Albums';
import '#models/Streams';
import '#models/Lyrics';
import Users from "../models/Users";

await mongoose.connect(MONGODB_URI);
console.log('Connected to MongoDB');

const db = mongoose.connection;

try {

  await db.asPromise();
  const user = await Users.getUserPlaylists("68635c1e527881ccc13814a6")
  console.log(JSON.stringify(user, null, 2))

} catch (error) {
  console.error('Error in main process:', error);
} finally {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}