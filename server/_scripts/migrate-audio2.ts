import mongoose from "mongoose";
import { MONGODB_URI, ALIYUN_OSS_REGION, ALIYUN_OSS_ACEESSKEYID, ALIYUN_OSS_ACEESSKEYSECRET, ALIYUN_OSS_BUCKET } from "./baka";
import StreamsTemp from "./StreamsTemp";
import OSS from "ali-oss"
import { resolveDownloadPath, fileExists } from "../utils/audioAnalyzer";
import path from "path";
import Songs from "../models/Songs";
import Albums from "../models/Albums";

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
  const allStreams = await StreamsTemp.find({});
  console.log(`Found ${allStreams.length} streams to process`);

  let processedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const stream of allStreams) {
    processedCount++;
    try {
      let url = undefined;

      if(stream.audio?.lossless) {
        url = stream.audio.lossless;
      } else if(stream.audio?.high) {
        url = stream.audio.high;
      } else if(stream.audio?.normal) {
        url = stream.audio.normal;
      } else {
        throw new Error("No audio URL found");
      }

      
      const filePath = resolveDownloadPath(url);
      if (!filePath) {
        throw new Error(`  Could not resolve path for ${url}`);
      }

      const exists = await fileExists(filePath);
      if (!exists) {
        throw new Error(`  File not found: ${filePath}`);
      }

      const coverPath = path.dirname(filePath) + '/cover.jpg';
      const coverExists = await fileExists(coverPath);
      if (!coverExists) {
        throw new Error(`  Cover file not found: ${coverPath}`);
      }

      const song = await Songs.findOne({_id: stream.songId});
      if(!song) {
        throw new Error(`  Song not found: ${stream.songId}`);
      }

      const album = await Albums.findOne({_id: song.album});
      if(!album) {
        throw new Error(`  Album not found: ${song.album}`);
      }
      
      const coverRemotePath = `cdn://cover/${stream._id.toString()}.jpg`;
      const coverUrl = `cover/${stream._id.toString()}.jpg`;
      try {
        await client.put(coverUrl, coverPath, {
          headers: {
            'Content-Type': 'image/jpeg',
            ...headers
          },
        });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if(error.code == "FileAlreadyExists") {
          console.log(`  File already exists, skipping`);
        } else {
          throw error;
        }
      }
      album.coverUrl = coverRemotePath;
      await album.save();

      updatedCount++;
      console.log(`  Updated stream ${stream.songId} with corrected audio field`);
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