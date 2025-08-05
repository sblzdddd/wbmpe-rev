import { YtDlp } from 'ytdlp-nodejs';

const ytdlp = new YtDlp();


async function downloadVideo() {
  try {
    const output = await ytdlp.getFileAsync(
      'https://www.bilibili.com/video/BV1dG411976n?p=1',
      {
        onProgress: (progress) => {
          console.log(progress.percentage);
          console.log(progress.speed_str);
        },
        format: "bestaudio+bestvideo",
        extractAudio: true,
        audioFormat: "mp3",
        keepVideo: true,
        output: "%(id)s.%(ext)s",
        // listSubs
        // others args
      }
    );
    console.log('Download completed:', output);
  } catch (error) {
    console.error('Error:', error);
  }
}

downloadVideo();
