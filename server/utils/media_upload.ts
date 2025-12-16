import OSS from 'ali-oss';
import BakaLogger from './logger/BakaLogger';
import fs from 'fs';
import path from 'path';

const logger = BakaLogger.child({service: 'MediaUploadService'})

// Import OSS configuration
const ALIYUN_OSS_REGION = process.env.ALIYUN_OSS_REGION;
const ALIYUN_OSS_ACCESS_KEY_ID = process.env.ALIYUN_OSS_ACEESSKEYID;
const ALIYUN_OSS_ACCESS_KEY_SECRET = process.env.ALIYUN_OSS_ACEESSKEYSECRET;
const ALIYUN_OSS_BUCKET = process.env.ALIYUN_OSS_BUCKET;

export interface MediaUploadResult {
  url: string;
  path: string;
  name: string;
}

export class MediaUploadService {
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

  async uploadMedia(
    filePath: string,
    ossPath: string = 'uploads/unknown',
    headers: Record<string, string> = {
      'x-oss-storage-class': 'Standard',
      'x-oss-object-acl': 'private',
    }
  ): Promise<MediaUploadResult> {
    try {
      const fileExtension = path.extname(filePath).slice(1);
      const stream = fs.createReadStream(filePath);
      const size = fs.statSync(filePath).size;
      const mime = this.getMediaContentType(fileExtension);
      logger.info(`uploading ${filePath} to oss (${ossPath}, ${mime})`);
      await this.client.putStream(ossPath, stream, {
        contentLength: size,
        timeout: 600000,
        mime: mime,
        headers: {
          ...headers,
          'Content-Type': mime,
        },
        meta: { uid: 0, pid: 0 },
        callback:{url: '', body: ''}
      });
      return {
        url: `cdn://${ossPath}`,
        path: ossPath,
        name: ossPath.split('/').pop() || '',
      };
    } catch (error) {
      logger.error('Media upload failed:', error);
      throw new Error('Failed to upload media to storage');
    }
  }

  
  // Upload an image buffer to OSS
  async uploadMediaFromBuffer(
    buffer: Buffer,
    ossPath: string = 'uploads/unknown',
    headers: Record<string, string> = {
      'x-oss-storage-class': 'Standard',
      'x-oss-object-acl': 'private',
    }
  ): Promise<MediaUploadResult> {
    try {
      // Generate unique filename
      const fileExtension = ossPath.split('.').pop()?.toLowerCase() || 'jpg';

      const result = await this.client.put(ossPath, buffer, { headers: {
        ...headers,
        'Content-Type': this.getMediaContentType(fileExtension),
      } });

      logger.log("verbose", "Media upload result:", result);

      return {
        url: `cdn://${ossPath}`,
        path: ossPath,
        name: ossPath.split('/').pop() || '',
      };
    } catch (error) {
      logger.error('Media upload failed:', error);
      throw new Error('Failed to upload media to storage');
    }
  }

  // Delete an audio/video file from OSS
  async deleteMedia(path: string): Promise<void> {
    try {
      const cleanPath = path.replace('cdn://', '');
      await this.client.delete(cleanPath);
    } catch (error) {
      logger.error('Media deletion failed:', error);
    }
  }

  private getMediaContentType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'flac': 'audio/flac',
      'aac': 'audio/aac',
      'm4a': 'audio/mp4',
      'ogg': 'audio/ogg',
      'opus': 'audio/opus',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'webm': 'video/webm'
    };
    return mimeTypes[extension] || 'audio/mpeg';
  }
}

// Export singleton instance
export const mediaUploadService = new MediaUploadService();
