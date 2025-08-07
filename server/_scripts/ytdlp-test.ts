import { YtDlp } from 'ytdlp-nodejs';
import fs from 'fs';
import type { UnparsedSongWithoutId } from '#types/Search/UnparsedSongs';
import type { VideoInfo, PlaylistInfo } from 'ytdlp-nodejs';

const ytdlp = new YtDlp();

// Type guard function to check if info is VideoInfo
function isVideoInfo(info: VideoInfo | PlaylistInfo): info is VideoInfo {
  return info._type === 'video';
}

async function findThumbnail(files: string[]) {
  const possibleThumbnailExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'ico', 'svg', 'heic', 'heif', 'avif'];
  for(const ext of possibleThumbnailExts) {
    const thumbnail = files.find(file => file.endsWith(`.${ext}`));
    if (thumbnail) {
      return 'temp/' + thumbnail;
    }
  }
  return null;
}

async function findFileWithName(files: string[], name: string) {
  const file = files.find(file => file === name);
  if (file) {
    return 'temp/' + file;
  }
  return null;
}

async function findSubs(files: string[]) {
  console.log(files);
  const subMap: Record<string, string> = {};
  const subs = files.filter(file => file.endsWith('.lrc'));
  if(!subs || subs.length === 0) return {};
  for(const sub of subs) {
    const content = fs.readFileSync(`temp/${sub}`, 'utf8');
    const fileNameComponents = sub.split('.');
    console.log(fileNameComponents);
    let subType = 'default';
    if(fileNameComponents.length > 2) {
      subType = fileNameComponents[fileNameComponents.length - 2];
    }
    subMap[subType] = content;
  }
  return subMap;
}

async function getInfo(url: string) {
  const info = await ytdlp.getInfoAsync(url);
  if(!isVideoInfo(info)) {
    throw new Error('URL is not a video');
  }
  if(info.duration > 420) {
    throw new Error('Duration is too long, skipping');
  }
  console.log(info);
  const placeholder = 'Unknown' + Math.random().toString(36).substring(2, 15);
  const unsavedUnparsedSong: UnparsedSongWithoutId = {
    artists: [{
      name: info.uploader || placeholder,
      platform: info.extractor,
      id: info.id || placeholder,
    }],
    album: {
      name: `${info.extractor || 'Unknown'}: ${info.id || placeholder}` ,
      platform: info.extractor,
      coverUrl: info.thumbnail || '',
      id: info.id || placeholder,
    },
    src: url,
    name: info.title || placeholder,
    duration: info.duration || 0,
    platform: info.extractor,
  };
  return unsavedUnparsedSong;
}


async function downloadStream(url: string) {
  //clear the files under temp folder
  fs.readdirSync('temp').forEach(file => fs.unlinkSync(`temp/${file}`));

  try {
    const unsavedUnparsedSong = await getInfo(url);
    console.log('Downloading video...');
    const output = await ytdlp.downloadAsync(
      url,
      {
        onProgress: (progress) => {
          console.log(progress.percentage);
          console.log(progress.speed_str);
        },
        // Use flexible format that falls back to audio-only when video isn't available
        format: "best[ext=mp4][height<=1440]/bestaudio/best",
        extractAudio: true,
        audioFormat: "mp3",
        keepVideo: true,
        // videoFormat: 'mp4',
        output: "temp/stream.%(ext)s",
        writeThumbnail: true,
        writeSubs: true,
        writeAllSubs: true,
        convertSubs: 'lrc',
        noPlaylist: true,
        // proxy: '',
        // others args
      }
    );
    console.log('Download completed:', output);
    const files = fs.readdirSync('temp');
    const audio = await findFileWithName(files, 'stream.mp3');
    if(!audio) {
      throw new Error('Audio file not found');
    }
    const thumbnail = await findThumbnail(files);
    const subs = await findSubs(files);
    const video = await findFileWithName(files, 'stream.mp4');
    console.log(thumbnail, subs, video);
    return unsavedUnparsedSong;
  } catch (error) {
    console.error('Error:', error);
  }
}

downloadStream('https://music.youtube.com/watch?v=rW5YRGMd9vQ&list=RDAMVMrW5YRGMd9vQ');
