import mongoose from "mongoose";
import { MONGODB_URI } from "./baka";
import '~/server/models/UserAuth';
import '~/server/models/UserSubscriptions';
import '~/server/models/Songs';
import '~/server/models/Artists';
import '~/server/models/Albums';
import '~/server/models/Streams';
import '~/server/models/Lyrics';
import Users from "../models/Users";

await mongoose.connect(MONGODB_URI);
console.log('Connected to MongoDB');

const db = mongoose.connection;

try {

  await db.asPromise();
  const user = await Users.getUserInfo("68655bb698fedd16decd2438")
  console.log(JSON.stringify(user, null, 2))

} catch (error) {
  console.error('Error in main process:', error);
} finally {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}