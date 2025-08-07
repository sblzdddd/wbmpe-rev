/* eslint-disable @typescript-eslint/no-explicit-any */
import { createWriteStream } from 'fs';
import { YtDlp } from 'ytdlp-nodejs';

const ytdlp = new YtDlp();


async function streamVideo() {
  try {
    console.log('Starting video stream from ytdlp...');
    
    const pipeResponse = ytdlp.stream(
      'https://www.bilibili.com/video/BV1dG411976n?p=1',
      {
        onProgress: (progress) => {
          console.log(`Download progress: ${progress.percentage}% - Speed: ${progress.speed_str}`);
          console.log(`Download progress: ${progress.total}`);
        },
        format: "bestaudio",
        extractAudio: true,
        audioFormat: "mp3",
      }
    );

    // Upload the PipeResponse to OSS at temp/stream.mp3
    if (pipeResponse) {
      console.log('PipeResponse received, starting upload to OSS...');
      const st = createWriteStream('video.mp4');
      // ytdlp.stream() returns a PipeResponse that needs to be piped to a writable stream
      await pipeResponse.pipeAsync(st);
      
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
