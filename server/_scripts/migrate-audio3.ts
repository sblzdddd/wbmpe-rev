import mongoose from "mongoose";
import { MONGODB_URI } from "./baka";
import Streams from "../models/Streams";

await mongoose.connect(MONGODB_URI);
console.log('Connected to MongoDB');

const db = mongoose.connection;

try {
  await db.asPromise();
  const allStreams = await Streams.find({});
  console.log(`Found ${allStreams.length} streams to process`);

  let processedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  const totalCount = allStreams.length;

  for (const stream of allStreams) {
    processedCount++;
    console.log(`Processing stream ${processedCount}/${totalCount} - Song ID: ${stream.songId}`);
    try {

      if(stream.audio?.lossless) {
        stream.audio.lossless = stream.audio.lossless.replace("https://wbmpe-data.oss-cn-shenzhen.aliyuncs.com/", "cdn://");
      } if(stream.audio?.high) {
        stream.audio.high = stream.audio.high.replace("https://wbmpe-data.oss-cn-shenzhen.aliyuncs.com/", "cdn://");
      } if(stream.audio?.normal) {
        stream.audio.normal = stream.audio.normal.replace("https://wbmpe-data.oss-cn-shenzhen.aliyuncs.com/", "cdn://");
      }

      if(stream.video) {
        stream.video = stream.video.replace("https://wbmpe-data.oss-cn-shenzhen.aliyuncs.com/", "cdn://");
      }

      await stream.save();
      updatedCount++;
      console.log(`  Updated stream ${stream.songId} with corrected audio fields`);
    } catch (error) {
      errorCount++;
      console.error(`  Error processing stream ${stream.songId}:`, error);
    }
  }

  console.log('\n=== Processing Summary ===');
  console.log(`Total streams processed: ${processedCount}`);
  console.log(`Streams updated: ${updatedCount}`);
  console.log(`Errors encountered: ${errorCount}`);

} catch (error) {
  console.error('Error in main process:', error);
} finally {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}