import mongoose from "mongoose";
import { MONGODB_URI } from "./baka";
import Streams from "../models/Streams";
import { analyzeAudioFile, determineAudioQuality, resolveDownloadPath, fileExists } from "../utils/audioAnalyzer";

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

  for (const stream of allStreams) {
    processedCount++;
    console.log(`Processing stream ${processedCount}/${allStreams.length} - Song ID: ${stream.songId}`);

    try {
      // Get all audio URLs from the stream
      const audioUrls = [
        { field: 'normal', url: stream.audio?.normal },
        { field: 'high', url: stream.audio?.high },
        { field: 'lossless', url: stream.audio?.lossless }
      ].filter(item => item.url); // Only process fields that have URLs

      if (audioUrls.length === 0) {
        console.log(`  No audio URLs found for stream ${stream.songId}`);
        continue;
      }

      if(audioUrls.length === 1) continue;

      // Analyze each audio file
      const audioAnalysis = [];
      for (const { field, url } of audioUrls) {
        if (!url) continue;

        const filePath = resolveDownloadPath(url);
        if (!filePath) {
          console.log(`  Could not resolve path for ${url}`);
          continue;
        }

        const exists = await fileExists(filePath);
        if (!exists) {
          console.log(`  File not found: ${filePath}`);
          continue;
        }

        const audioInfo = await analyzeAudioFile(filePath);
        if (audioInfo) {
          const quality = determineAudioQuality(audioInfo);
          audioAnalysis.push({
            field,
            url,
            filePath,
            audioInfo,
            quality
          });
          console.log(`  ${field}: ${quality} (${audioInfo.bitrate}bps, ${audioInfo.sampleRate}Hz)`);
        }
      }

      if (audioAnalysis.length === 0) {
        console.log(`  No valid audio files found for stream ${stream.songId}`);
        continue;
      }

      // Create new audio object with only the correct quality fields
      const newAudio: { normal?: string; high?: string; lossless?: string } = {};
      let hasChanges = false;

      for (const { field, url, quality } of audioAnalysis) {
        // Only keep the URL if the quality matches the field
        if (field === quality) {
          newAudio[field as keyof typeof newAudio] = url;
        } else {
          hasChanges = true;
          console.log(`  Removing ${field} field (actual quality: ${quality})`);
        }
      }

      // Update the stream if there are changes
      if (hasChanges) {
        // Use $unset to remove fields that don't match quality, then $set for the correct ones
        const unsetFields: { [key: string]: string } = {};
        const setFields: { [key: string]: string } = {};
        
        for (const { field, url, quality } of audioAnalysis) {
          if (field === quality) {
            setFields[`audio.${field}`] = url;
          } else {
            unsetFields[`audio.${field}`] = "";
          }
        }

        const updateOperation: { $unset?: { [key: string]: string }; $set?: { [key: string]: string } } = {};
        if (Object.keys(unsetFields).length > 0) {
          updateOperation.$unset = unsetFields;
        }
        if (Object.keys(setFields).length > 0) {
          updateOperation.$set = setFields;
        }

        await Streams.updateOne(
          { _id: stream._id },
          updateOperation
        );
        updatedCount++;
        console.log(`  Updated stream ${stream.songId} with corrected audio fields`);
      } else {
        console.log(`  No changes needed for stream ${stream.songId}`);
      }

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