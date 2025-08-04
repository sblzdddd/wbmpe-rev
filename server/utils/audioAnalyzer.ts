import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';

const logger = BakaLogger.child({service: 'AudioAnalyzer'})

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
        logger.error(`Error analyzing ${filePath}:`, err.message);
        resolve(null);
        return;
      }

      const audioStream = metadata.streams?.find(stream => stream.codec_type === 'audio');
      if (!audioStream) {
        logger.error(`No audio stream found in ${filePath}`);
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

export async function decreaseAudioBitrate(
  inputPath: string, 
  outputPath: string, 
  quality: 'high' | 'normal'
): Promise<boolean> {
  return new Promise((resolve) => {
    const bitrate = quality === 'high' ? '320k' : '128k';
    
    ffmpeg(inputPath)
      .audioBitrate(bitrate)
      .audioCodec('libmp3lame') // Use MP3 codec for compatibility
      .audioChannels(2) // Stereo
      .audioFrequency(44100) // 44.1kHz sample rate
      .on('end', () => {
        logger.info(`Successfully converted ${inputPath} to ${quality} quality (${bitrate})`);
        resolve(true);
      })
      .on('error', (err) => {
        logger.error(`Error converting ${inputPath} to ${quality} quality:`, err.message);
        resolve(false);
      })
      .save(outputPath);
    return true;
  });
}

export async function createQualityVersions(
  inputPath: string, 
  outputDir: string, 
  baseFileName: string
): Promise<{ high?: string; normal?: string }> {
  const results: { high?: string; normal?: string } = {};
  
  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Create high quality version (320kbps)
    const highPath = path.join(outputDir, `${baseFileName}_high.mp3`);
    const highSuccess = await decreaseAudioBitrate(inputPath, highPath, 'high');
    if (highSuccess) {
      results.high = highPath;
    }
    
    // Create normal quality version (128kbps)
    const normalPath = path.join(outputDir, `${baseFileName}_normal.mp3`);
    const normalSuccess = await decreaseAudioBitrate(inputPath, normalPath, 'normal');
    if (normalSuccess) {
      results.normal = normalPath;
    }
    
    return results;
  } catch (error) {
    logger.error('Error creating quality versions:', error);
    return results;
  }
}

export function resolveDownloadPath(downloadUrl: string): string | null {
  // Handle downloads:// protocol
  if (downloadUrl.startsWith('downloads://')) {
    const relativePath = downloadUrl.replace('downloads://', '');
    return path.join(process.cwd(), 'server', 'data', 'downloads', relativePath);
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