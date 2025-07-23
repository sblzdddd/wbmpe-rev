import mongoose from "mongoose";
import { MONGODB_URI, ALIYUN_OSS_REGION, ALIYUN_OSS_ACEESSKEYID, ALIYUN_OSS_ACEESSKEYSECRET, ALIYUN_OSS_BUCKET } from "./baka";
import Streams from "../models/Streams";
import { resolveDownloadPath, fileExists, decreaseAudioBitrate } from "../utils/audioAnalyzer";
import OSS from "ali-oss"

await mongoose.connect(MONGODB_URI);
console.log('Connected to MongoDB');

const db = mongoose.connection;

try {
  await db.asPromise();
  const client = new OSS({
    // 从环境变量中获取访问凭证。运行本代码示例之前，请确保已设置环境变量OSS_ACCESS_KEY_ID和OSS_ACCESS_KEY_SECRET。
    accessKeyId: ALIYUN_OSS_ACEESSKEYID,
    accessKeySecret: ALIYUN_OSS_ACEESSKEYSECRET,
    // yourRegion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
    region: ALIYUN_OSS_REGION,
    // yourBucketName填写Bucket名称。
    bucket: ALIYUN_OSS_BUCKET,
    // yourEndpoint填写Bucket所在地域对应的公网Endpoint。以华东1（杭州）为例，Endpoint填写为https://oss-cn-hangzhou.aliyuncs.com。
    endpoint: `https://${ALIYUN_OSS_REGION}.aliyuncs.com`,
  });
  
  // 自定义请求头
  const headers = {
    // 指定Object的存储类型。
    'x-oss-storage-class': 'Standard',
    // 指定Object的访问权限。
    'x-oss-object-acl': 'private',
    // 通过文件URL访问文件时，指定以附件形式下载文件，下载后的文件名称定义为example.txt。
    'Content-Disposition': 'attachment; filename="example.txt"',
    // 设置Object的标签，可同时设置多个标签。
    'x-oss-tagging': 'Tag1=1&Tag2=2',
    // 指定PutObject操作时是否覆盖同名目标Object。此处设置为true，表示禁止覆盖同名Object。
    'x-oss-forbid-overwrite': 'true',
  };
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

      let url = undefined;
      let quality = 'normal';

      if(stream.audio?.lossless) {
        url = stream.audio.lossless;
        quality = 'lossless';
      } else if(stream.audio?.high) {
        url = stream.audio.high;
        quality = 'high';
      } else if(stream.audio?.normal) {
        url = stream.audio.normal;
      } else {
        throw new Error("No audio URL found");
      }

      if(url.startsWith("https://wbmpe-data.oss-cn-shenzhen")) {
        console.log(`  Skipping ${url} because it is already in the correct format`);
        continue;
      }

      const filePath = resolveDownloadPath(url);
      if (!filePath) {
        throw new Error(`  Could not resolve path for ${url}`);
      }

      const exists = await fileExists(filePath);
      if (!exists) {
        throw new Error(`  File not found: ${filePath}`);
      }

      let normalQuality = undefined;
      let highQuality = undefined;
      let losslessQuality = undefined;

      if(quality === 'lossless') {
        losslessQuality = filePath;
        if(!await decreaseAudioBitrate(filePath, `${filePath}.high.mp3`, 'high')) {
          throw new Error(`  Failed to decrease audio bitrate for ${filePath}`);
        }
        normalQuality = `${filePath}.normal.mp3`;
        if(!await decreaseAudioBitrate(filePath, `${filePath}.normal.mp3`, 'normal')) {
          throw new Error(`  Failed to decrease audio bitrate for ${filePath}`);
        }
        highQuality = `${filePath}.high.mp3`;
      } else if(quality === 'high') {
        losslessQuality = undefined;
        highQuality = filePath;
        normalQuality = `${filePath}.normal.mp3`;
        if(!await decreaseAudioBitrate(filePath, `${filePath}.normal.mp3`, 'normal')) {
          throw new Error(`  Failed to decrease audio bitrate for ${filePath}`);
        }
      } else if(quality === 'normal') {
        losslessQuality = undefined;
        highQuality = undefined;
        normalQuality = filePath;
      }

      try {
        const ossPath = `audio/${stream._id.toString()}n.mp3`;
        const result = await client.put(ossPath, normalQuality, {
          headers: headers,
        });
        console.log(result);
  
        if(highQuality) {
          const ossPath = `audio/${stream._id.toString()}h.mp3`;
          const result = await client.put(ossPath, highQuality, {
            headers: headers,
          });
          console.log(result);
        }
  
        if(losslessQuality) {
          const ossPath = `audio/${stream._id.toString()}l.mp3`;
          const result = await client.put(ossPath, losslessQuality, {
            headers: headers,
          });
          console.log(result);
        }
  
        if(stream.video) {
          const videoPath = resolveDownloadPath(stream.video);
          if (!videoPath) {
            throw new Error(`  Could not resolve path for ${stream.video}`);
          }
  
          const exists = await fileExists(videoPath);
          if (!exists) {
            throw new Error(`  File not found: ${videoPath}`);
          }
  
          const ossVideoPath = `video/${stream._id.toString()}.mp4`;
          const videoResult = await client.put(ossVideoPath, videoPath, {
            headers: headers,
          });
          console.log(videoResult);
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if(error.code == "FileAlreadyExists") {
          console.log(`  File already exists, skipping`);
        } else {
          throw error;
        }
      }
      stream.audio.normal = `https://${ALIYUN_OSS_BUCKET}.${ALIYUN_OSS_REGION}.aliyuncs.com/audio/${stream._id.toString()}n.mp3`;
      if(highQuality) stream.audio.high = `https://${ALIYUN_OSS_BUCKET}.${ALIYUN_OSS_REGION}.aliyuncs.com/audio/${stream._id.toString()}h.mp3`;
      if(losslessQuality) stream.audio.lossless = `https://${ALIYUN_OSS_BUCKET}.${ALIYUN_OSS_REGION}.aliyuncs.com/audio/${stream._id.toString()}l.mp3`;
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