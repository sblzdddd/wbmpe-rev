import mongoose from "mongoose";
import { MONGODB_URI } from "./baka";

await mongoose.connect(MONGODB_URI);
console.log('Connected to MongoDB');

const db = mongoose.connection;

try {

  await db.asPromise();
  const ids = await Users.getFavoriteSongIds("68635c1e527881ccc13814a6")
  console.log(JSON.stringify(ids, null, 2))

} catch (error) {
  console.error('Error in main process:', error);
} finally {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}