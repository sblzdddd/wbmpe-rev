import OSS from 'ali-oss';
// import { randomUUID } from 'crypto';
import BakaLogger from './logger/BakaLogger';
import fs from 'fs';
import path from 'path';

const logger = BakaLogger.child({service: 'AudioUploadService'})

// Import OSS configuration
const ALIYUN_OSS_REGION = process.env.ALIYUN_OSS_REGION;
const ALIYUN_OSS_ACCESS_KEY_ID = process.env.ALIYUN_OSS_ACEESSKEYID;
const ALIYUN_OSS_ACCESS_KEY_SECRET = process.env.ALIYUN_OSS_ACEESSKEYSECRET;
const ALIYUN_OSS_BUCKET = process.env.ALIYUN_OSS_BUCKET;

export interface AudioUploadResult {
  url: string;
  path: string;
  name: string;
  quality: 'normal' | 'high' | 'lossless';
}

export interface VideoUploadResult {
  url: string;
  path: string;
  name: string;
}

export class AudioUploadService {
  private client: OSS;

  constructor() {
    if (!ALIYUN_OSS_REGION || !ALIYUN_OSS_ACCESS_KEY_ID || !ALIYUN_OSS_ACCESS_KEY_SECRET || !ALIYUN_OSS_BUCKET) {
      logger.error('Missing required Aliyun OSS configuration');
      throw new Error('Missing required Aliyun OSS configuration');
    }

    this.client = new OSS({
      accessKeyId: ALIYUN_OSS_ACCESS_KEY_ID,
      accessKeySecret: ALIYUN_OSS_ACCESS_KEY_SECRET,
      region: ALIYUN_OSS_REGION,
      bucket: ALIYUN_OSS_BUCKET,
      endpoint: `https://${ALIYUN_OSS_REGION}.aliyuncs.com`,
    });
  }

  /**
   * Upload an audio file to OSS
   */
  async uploadAudio(
    filePath: string,
    songId: string,
    quality: 'normal' | 'high' | 'lossless' = 'normal'
  ): Promise<AudioUploadResult> {
    try {
      // Read file
      const buffer = fs.readFileSync(filePath);
      const fileExtension = path.extname(filePath).slice(1);
      const fileName = `${songId}${quality.substring(0, 1)}.${fileExtension}`;
      const ossPath = `audio/${fileName}`;

      // Upload headers
      const headers = {
        'x-oss-storage-class': 'Standard',
        'x-oss-object-acl': 'private', // Audio files should be private
        'Content-Type': this.getAudioContentType(fileExtension),
      };

      // Upload to OSS
      const result = await this.client.put(ossPath, buffer, { headers });

      logger.log("verbose", "Audio upload result:", result);

      return {
        url: `cdn://${ossPath}`,
        path: ossPath,
        name: fileName,
        quality
      };
    } catch (error) {
      logger.error('Audio upload failed:', error);
      throw new Error('Failed to upload audio to storage');
    }
  }

  /**
   * Upload a video file to OSS
   */
  async uploadVideo(
    filePath: string,
    songId: string
  ): Promise<VideoUploadResult> {
    try {
      // Read file
      const buffer = fs.readFileSync(filePath);
      const fileExtension = path.extname(filePath).slice(1);
      const fileName = `${songId}.${fileExtension}`;
      const ossPath = `video/${fileName}`;

      // Upload headers
      const headers = {
        'x-oss-storage-class': 'Standard',
        'x-oss-object-acl': 'private', // Video files should be private
        'Content-Type': this.getVideoContentType(fileExtension),
      };

      // Upload to OSS
      const result = await this.client.put(ossPath, buffer, { headers });

      logger.log("verbose", "Video upload result:", result);

      return {
        url: `cdn://${ossPath}`,
        path: ossPath,
        name: fileName
      };
    } catch (error) {
      logger.error('Video upload failed:', error);
      throw new Error('Failed to upload video to storage');
    }
  }

  /**
   * Delete an audio/video file from OSS
   */
  async deleteMedia(path: string): Promise<void> {
    try {
      // Remove cdn:// prefix if present
      const cleanPath = path.replace('cdn://', '');
      await this.client.delete(cleanPath);
    } catch (error) {
      logger.error('Media deletion failed:', error);
      // Don't throw here - deletion failures shouldn't break the main operation
    }
  }

  private getAudioContentType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'flac': 'audio/flac',
      'aac': 'audio/aac',
      'm4a': 'audio/mp4',
      'ogg': 'audio/ogg',
      'opus': 'audio/opus'
    };
    return mimeTypes[extension] || 'audio/mpeg';
  }

  private getVideoContentType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'webm': 'video/webm'
    };
    return mimeTypes[extension] || 'video/mp4';
  }
}

// Export singleton instance
export const audioUploadService = new AudioUploadService();
