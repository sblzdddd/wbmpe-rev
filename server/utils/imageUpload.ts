import OSS from 'ali-oss';
import { randomUUID } from 'crypto';
import BakaLogger from './BakaLogger';

const logger = BakaLogger.child({service: 'ImageUploadService'})

// Import OSS configuration - you'll need to adjust these import paths based on your config file location
// For now, I'll use environment variables as fallback
const ALIYUN_OSS_REGION = process.env.ALIYUN_OSS_REGION;
const ALIYUN_OSS_ACCESS_KEY_ID = process.env.ALIYUN_OSS_ACEESSKEYID;
const ALIYUN_OSS_ACCESS_KEY_SECRET = process.env.ALIYUN_OSS_ACEESSKEYSECRET;
const ALIYUN_OSS_BUCKET = process.env.ALIYUN_OSS_BUCKET;

export interface ImageUploadResult {
  url: string;
  path: string;
  name: string;
}

export class ImageUploadService {
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
   * Upload an image buffer to OSS
   */
  async uploadImage(
    buffer: Buffer,
    originalName: string,
    folder: string = 'images'
  ): Promise<ImageUploadResult> {
    try {
      // Generate unique filename
      const fileExtension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${randomUUID()}.${fileExtension}`;
      const ossPath = `${folder}/${fileName}`;

      // Upload headers
      const headers = {
        'x-oss-storage-class': 'Standard',
        'x-oss-object-acl': 'public-read', // Make images publicly readable
        'Content-Type': this.getContentType(fileExtension),
      };

      // Upload to OSS
      const result = await this.client.put(ossPath, buffer, { headers });

      logger.log("verbose", "Image upload result:", result);

      return {
        url: `cdn://${ossPath}`, // Use CDN protocol prefix like in your migration scripts
        path: ossPath,
        name: fileName
      };
    } catch (error) {
      logger.error('Image upload failed:', error);
      throw new Error('Failed to upload image to storage');
    }
  }

  /**
   * Upload playlist cover image
   */
  async uploadPlaylistCover(buffer: Buffer, originalName: string, playlistId: string): Promise<ImageUploadResult> {
    const fileExtension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${playlistId}.${fileExtension}`;
    const ossPath = `playlist-covers/${fileName}`;

    try {
      const headers = {
        'x-oss-storage-class': 'Standard',
        'x-oss-object-acl': 'private',
        'Content-Type': this.getContentType(fileExtension),
        'x-oss-forbid-overwrite': 'false',
      };

      await this.client.put(ossPath, buffer, { headers });

      return {
        url: `cdn://${ossPath}`,
        path: ossPath,
        name: fileName
      };
    } catch (error) {
      logger.error('Playlist cover upload failed:', error);
      throw new Error('Failed to upload playlist cover');
    }
  }

  /**
   * Delete an image from OSS
   */
  async deleteImage(path: string): Promise<void> {
    try {
      // Remove cdn:// prefix if present
      const cleanPath = path.replace('cdn://', '');
      await this.client.delete(cleanPath);
    } catch (error) {
      logger.error('Image deletion failed:', error);
      // Don't throw here - deletion failures shouldn't break the main operation
    }
  }

  private getContentType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml'
    };
    return mimeTypes[extension] || '';
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large. Maximum size is 5MB.' };
  }

  return { valid: true };
}

// Export singleton instance
export const imageUploadService = new ImageUploadService(); 