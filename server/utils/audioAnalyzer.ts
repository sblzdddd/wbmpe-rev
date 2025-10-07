import ffmpeg from 'ffmpeg-static';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const logger = BakaLogger.child({service: 'AudioAnalyzer'})

export interface AudioInfo {
  bitrate: number;
  sampleRate: number;
  channels: number;
  duration: number;
  format: string;
}

export async function analyzeAudioFile(filePath: string): Promise<AudioInfo | null> {
  try {
    if (!ffmpeg) {
      logger.error('FFmpeg binary not found');
      return null;
    }
    
    const ffprobePath = ffmpeg.replace('ffmpeg', 'ffprobe');
    const command = `"${ffprobePath}" -v quiet -print_format json -show_format -show_streams "${filePath}"`;
    
    const { stdout } = await execAsync(command);
    const metadata = JSON.parse(stdout);

    const audioStream = metadata.streams?.find((stream: {codec_type: string}) => stream.codec_type === 'audio');
    if (!audioStream) {
      logger.error(`No audio stream found in ${filePath}`);
      return null;
    }

    const info: AudioInfo = {
      bitrate: parseInt(String(audioStream.bit_rate || '0')),
      sampleRate: parseInt(String(audioStream.sample_rate || '0')),
      channels: audioStream.channels || 0,
      duration: parseFloat(String(metadata.format?.duration || '0')),
      format: metadata.format?.format_name || 'unknown'
    };

    return info;
  } catch (err) {
    logger.error(`Error analyzing ${filePath}:`, err);
    return null;
  }
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
  try {
    if (!ffmpeg) {
      logger.error('FFmpeg binary not found');
      return false;
    }
    
    const bitrate = quality === 'high' ? '320k' : '128k';
    
    const command = `"${ffmpeg}" -i "${inputPath}" -b:a ${bitrate} -acodec libmp3lame -ac 2 -ar 44100 "${outputPath}"`;
    
    await execAsync(command);
    logger.info(`Successfully converted ${inputPath} to ${quality} quality (${bitrate})`);
    return true;
  } catch (err) {
    logger.error(`Error converting ${inputPath} to ${quality} quality:`, err);
    return false;
  }
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