import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';

export interface AudioInfo {
  bitrate: number;
  sampleRate: number;
  channels: number;
  duration: number;
  format: string;
}

export async function analyzeAudioFile(filePath: string): Promise<AudioInfo | null> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error(`Error analyzing ${filePath}:`, err.message);
        resolve(null);
        return;
      }

      const audioStream = metadata.streams?.find(stream => stream.codec_type === 'audio');
      if (!audioStream) {
        console.error(`No audio stream found in ${filePath}`);
        resolve(null);
        return;
      }

      const info: AudioInfo = {
        bitrate: parseInt(String(audioStream.bit_rate || '0')),
        sampleRate: parseInt(String(audioStream.sample_rate || '0')),
        channels: audioStream.channels || 0,
        duration: parseFloat(String(metadata.format?.duration || '0')),
        format: metadata.format?.format_name || 'unknown'
      };

      resolve(info);
    });
  });
}

export function determineAudioQuality(audioInfo: AudioInfo): 'normal' | 'high' | 'lossless' | 'unknown' {
  const { bitrate, sampleRate } = audioInfo;
  
  // Lossless quality indicators
  if (bitrate >= 1000000 || sampleRate >= 96000) {
    return 'lossless';
  }
  
  // High quality indicators
  if (bitrate >= 320000 || sampleRate >= 48000) {
    return 'high';
  }
  
  // Normal quality
  if (bitrate >= 128000 || sampleRate >= 44100) {
    return 'normal';
  }
  
  return 'unknown';
}

export function resolveDownloadPath(downloadUrl: string): string | null {
  // Handle downloads:// protocol
  if (downloadUrl.startsWith('downloads://')) {
    const relativePath = downloadUrl.replace('downloads://', '');
    return path.join(process.cwd(), 'src', 'server', 'data', 'downloads', relativePath.replaceAll(/["'*:]/g, '_'));
  }
  
  return null;
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
} 