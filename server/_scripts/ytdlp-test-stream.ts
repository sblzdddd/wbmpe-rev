/* eslint-disable @typescript-eslint/no-explicit-any */
import { YtDlp } from 'ytdlp-nodejs';
import { ALIYUN_OSS_ACEESSKEYID, ALIYUN_OSS_ACEESSKEYSECRET, ALIYUN_OSS_REGION, ALIYUN_OSS_BUCKET } from './baka';
import OSS from "ali-oss"
import { PassThrough } from 'stream';

const ytdlp = new YtDlp();

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

/**
 * Wait for contentLength to be available
 * @param timeout - Maximum time to wait in milliseconds (default: 30000)
 * @returns Promise that resolves when contentLength > 0
 */
async function waitForContentLength(timeout: number = 30000): Promise<number> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkContentLength = () => {
      if (contentLength > 0) {
        console.log(`Content length available: ${contentLength}`);
        resolve(contentLength);
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for content length after ${timeout}ms`));
        return;
      }
      
      // Check again in 100ms
      setTimeout(checkContentLength, 100);
    };
    
    checkContentLength();
  });
}

/**
 * Convert PipeResponse to a ReadableStream and upload to OSS
 * @param pipeResponse - The PipeResponse from ytdlp.stream()
 * @param objectPath - The path where the object will be stored in OSS
 * @returns Promise with upload result
 */
async function uploadPipeResponseToOSS(pipeResponse: any, objectPath: string) {
  try {
    console.log(`Starting upload to OSS: ${objectPath}`);
    
    // Create a PassThrough stream to bridge PipeResponse and OSS putStream
    const passThrough = new PassThrough({
      highWaterMark: 64 * 1024, // 64KB buffer for better streaming
    });
    
    // Handle stream errors
    passThrough.on('error', (error) => {
      console.error('PassThrough stream error:', error);
    });

    passThrough.on('pipe', () => {
      console.log('Pipe established, data will start flowing...');
    });

    passThrough.on('data', (chunk) => {
      console.log(`Received chunk: ${chunk.length} bytes`);
    });

    passThrough.on('end', () => {
      console.log('PassThrough stream ended');
    });

    // Set up the pipe first
    console.log('Setting up pipe from ytdlp to PassThrough...');
    pipeResponse.pipe(passThrough);

    // Wait for contentLength to be available before starting upload
    console.log('Waiting for content length...');
    const finalContentLength = await waitForContentLength();
    
    // Start the upload with the known content length
    console.log(`Starting OSS upload with content length: ${finalContentLength}...`);
    // @ts-expect-error - contentLength is not defined
    const result = await client.putStream(objectPath, passThrough, {contentLength: finalContentLength});
    
    console.log('Upload successful!');
    console.log('OSS Upload Result:', {
      name: result.name,
      res: {
        status: result.res.status,
        headers: result.res.headers
      }
    });
    
    return result;
  } catch (error) {
    console.error('OSS Upload Error:', error);
    throw error;
  }
}

let contentLength = 0;

async function streamVideo() {
  try {
    console.log('Starting video stream from ytdlp...');
    
    const pipeResponse = ytdlp.stream(
      'https://www.bilibili.com/video/BV1dG411976n?p=1',
      {
        onProgress: (progress) => {
          console.log(`Download progress: ${progress.percentage}% - Speed: ${progress.speed_str}`);
          console.log(`Download progress: ${progress.total}`);
          contentLength = progress.total;
        },
        format: "bestaudio",
        extractAudio: true,
        audioFormat: "mp3",
      }
    );

    // Upload the PipeResponse to OSS at temp/stream.mp3
    if (pipeResponse) {
      console.log('PipeResponse received, starting upload to OSS...');
      // ytdlp.stream() returns a PipeResponse that needs to be piped to a writable stream
      await uploadPipeResponseToOSS(pipeResponse, 'temp/stream.mp3');
      
      // Wait for the download to complete
      try {
        const result = await pipeResponse.promise;
        console.log('Download completed:', result);
      } catch (downloadError) {
        console.error('Download error:', downloadError);
      }
    } else {
      console.error('No PipeResponse received from ytdlp');
    }

  } catch (error) {
    console.error('Error in streamVideo:', error);
  }
}

streamVideo();
