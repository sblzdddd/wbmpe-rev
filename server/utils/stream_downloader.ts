import { YtDlp } from 'ytdlp-nodejs';
import fs from 'fs';
import path from 'path';
import BakaLogger from './logger/BakaLogger';
import { mediaUploadService, type MediaUploadResult } from './media_upload';
import { analyzeAudioFile, determineAudioQuality, decreaseAudioBitrate } from './audioAnalyzer';
import ParseTasks from '../models/ParseTasks';
import { sendTaskProgress, sendTaskStatus } from './sse/parse_task_sse';



const logger = BakaLogger.child({service: 'StreamDownloader'});

export interface DownloadResult {
  audio: {
    normal?: MediaUploadResult;
    high?: MediaUploadResult;
    lossless?: MediaUploadResult;
  };
  video: MediaUploadResult | null;
  thumbnail: string | null;
}

export interface DownloadOptions {
  url: string;
  songId: string;
  keepVideo?: boolean;
  taskId?: string;
  userId?: string;
}

export class StreamDownloader {
  private tempDir: string;
  private ytdlp: YtDlp;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    this.ytdlp = new YtDlp();
  }

  /**
   * Download and upload a stream from a URL
   */
  async downloadAndUpload(options: DownloadOptions): Promise<DownloadResult> {
    const { url, songId, keepVideo = true, taskId, userId } = options;

    try {
      logger.info(`Starting download for song ${songId} from: ${url}`);

      // Update task progress: Starting download
      if (taskId && userId) {
        await ParseTasks.updateProgress(taskId, 0, 'Preparing download...');
        sendTaskProgress(userId, taskId, 0, 'Preparing download...', 'downloading');
      }

      // Prepare temp directory
      this.prepareTempDirectory();

      // Update task progress: Download starting
      if (taskId && userId) {
        await ParseTasks.updateProgress(taskId, 0, 'Starting download...');
        sendTaskProgress(userId, taskId, 0, 'Starting download...', 'downloading');
      }

      // Download the stream
      await this.downloadStream(url, taskId, userId);

      // Update task progress: Download completed
      if (taskId && userId) {
        await ParseTasks.updateProgress(taskId, 50, 'Download completed, processing...');
        sendTaskProgress(userId, taskId, 50, 'Download completed, processing...', 'processing');
        await ParseTasks.updateStatus(taskId, 'processing');
      }

      // Find downloaded files
      const { audioFile, videoFile, thumbnailFile } = this.findDownloadedFiles();

      if (!audioFile) {
        throw new Error('Audio file not found after download');
      }

      // Update task progress: Processing audio
      if (taskId && userId) {
        await ParseTasks.updateProgress(taskId, 60, 'Processing audio quality versions...');
        sendTaskProgress(userId, taskId, 60, 'Processing audio quality versions...', 'processing');
      }

      // Analyze and create quality versions
      const audioResults = await this.processAudioQualities(audioFile, songId, taskId, userId);

      let videoUploadResult = null;
      if (keepVideo && videoFile) {
        // Update task progress: Processing video
        if (taskId && userId) {
          await ParseTasks.updateProgress(taskId, 85, 'Uploading video...');
          sendTaskProgress(userId, taskId, 85, 'Uploading video...', 'processing');
        }

        const videoPath = path.join(this.tempDir, videoFile);
        videoUploadResult = await mediaUploadService.uploadMedia(videoPath, `video/${songId}.mp4`);
      }

      let thumbnailURL: string | null = null;
      if(thumbnailFile) {
        const thumbnailPath = path.join(this.tempDir, thumbnailFile);
        const thumbnailUploadResult = await mediaUploadService.uploadMedia(thumbnailPath, `thumbnails/${songId}.jpg`);
        thumbnailURL = thumbnailUploadResult.url;
      }

      // Update task progress: Finalizing
      if (taskId && userId) {
        await ParseTasks.updateProgress(taskId, 95, 'Finalizing...');
        sendTaskProgress(userId, taskId, 95, 'Finalizing...', 'processing');
      }

      logger.info(`Successfully downloaded and uploaded stream for song ${songId}`);

      return {
        audio: audioResults,
        video: videoUploadResult,
        thumbnail: thumbnailURL
      };

    } catch (error) {
      logger.error(`Failed to download stream for song ${songId}:`, error);
      
      // Update task as failed if task tracking is enabled
      if (taskId && userId) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await ParseTasks.updateStatus(taskId, 'failed', errorMessage);
        sendTaskStatus(userId, taskId, 'failed', errorMessage);
      }
      throw error;
    }
  }

  /**
   * Prepare the temp directory for downloads
   */
  private prepareTempDirectory(): void {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    // Clear existing files in temp folder
    const tempFiles = fs.readdirSync(this.tempDir);
    tempFiles.forEach(file => {
      const filePath = path.join(this.tempDir, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    });
  }

  /**
   * Download the stream using ytdlp
   */
  private async downloadStream(url: string, taskId?: string, userId?: string): Promise<void> {
    logger.info(`Downloading from URL: ${url}`);
    // Clean up temp files
    this.cleanupTempFiles();

    await this.ytdlp.downloadAsync(url, {
      onProgress: (progress) => {
        if (progress.percentage) {
          logger.debug(`Download progress: ${progress.percentage}%`);
          
          // Send real-time progress updates via WebSocket
          if (taskId && userId) {
            // Map download progress to 10-50% range (download phase)
            const mappedProgress = 0 + (progress.percentage * 0.5);
            ParseTasks.updateProgress(taskId, Math.round(mappedProgress), `Downloading... ${Math.round(progress.percentage)}%`).catch(err => {
              logger.warn('Failed to update task progress:', err);
            });
            
            sendTaskProgress(
              userId,
              taskId,
              Math.round(mappedProgress),
              `Downloading... ${progress.speed_str}`,
              'downloading'
            );
          }
        }
      },
      format: "best[ext=mp4][height<=1440]/bestaudio/best",
      extractAudio: true,
      audioFormat: "mp3",
      keepVideo: true,
      output: path.join(this.tempDir, "stream.%(ext)s"),
      writeThumbnail: true,
      noPlaylist: true,
    });
  }

  private findThumbnail(files: string[]) {
    const possibleThumbnailExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'ico', 'svg', 'heic', 'heif', 'avif'];
    for(const ext of possibleThumbnailExts) {
      const thumbnail = files.find(file => file.endsWith(`.${ext}`));
      if (thumbnail) {
        return 'temp/' + thumbnail;
      }
    }
    return null;
  }
  /**
   * Find downloaded audio and video files
   */
  private findDownloadedFiles(): { audioFile: string | null; videoFile: string | null; thumbnailFile: string | null } {
    const downloadedFiles = fs.readdirSync(this.tempDir);
    
    const audioFile = downloadedFiles.find(file => file === 'stream.mp3') || null;
    const videoFile = downloadedFiles.find(file => file === 'stream.mp4') || null;
    const thumbnailFile = this.findThumbnail(downloadedFiles) || null;

    logger.debug(`Found files - Audio: ${audioFile}, Video: ${videoFile}`);

    return { audioFile, videoFile, thumbnailFile };
  }

  /**
   * Process audio file to create multiple quality versions
   */
  private async processAudioQualities(
    audioFile: string, 
    songId: string,
    taskId?: string,
    userId?: string
  ): Promise<{ normal?: MediaUploadResult; high?: MediaUploadResult; lossless?: MediaUploadResult }> {
    const audioPath = path.join(this.tempDir, audioFile);
    const results: { normal?: MediaUploadResult; high?: MediaUploadResult; lossless?: MediaUploadResult } = {};

    try {
      // Analyze the original audio file
      const audioInfo = await analyzeAudioFile(audioPath);
      if (!audioInfo) {
        throw new Error('Failed to analyze audio file');
      }

      const detectedQuality = determineAudioQuality(audioInfo);
      logger.info(`Detected audio quality: ${detectedQuality} (${audioInfo.bitrate}bps, ${audioInfo.sampleRate}Hz)`);

      // Create quality versions based on detected quality
      if (detectedQuality === 'lossless') {
        // Original is lossless - create all three qualities
        if (taskId && userId) {
          await ParseTasks.updateProgress(taskId, 65, 'Uploading lossless version...');
          sendTaskProgress(userId, taskId, 65, 'Uploading lossless version...', 'processing');
        }
        results.lossless = await mediaUploadService.uploadMedia(audioPath, `audio/${songId}l.mp3`);

        // Create high quality version
        if (taskId && userId) {
          await ParseTasks.updateProgress(taskId, 70, 'Creating high quality version...');
          sendTaskProgress(userId, taskId, 70, 'Creating high quality version...', 'processing');
        }
        const highPath = path.join(this.tempDir, `${songId}_high.mp3`);
        const highSuccess = await decreaseAudioBitrate(audioPath, highPath, 'high');
        if (highSuccess) {
          if (taskId && userId) {
            await ParseTasks.updateProgress(taskId, 75, 'Uploading high quality version...');
            sendTaskProgress(userId, taskId, 75, 'Uploading high quality version...', 'processing');
          }
          results.high = await mediaUploadService.uploadMedia(highPath, `audio/${songId}h.mp3`);
        }

        // Create normal quality version
        if (taskId && userId) {
          await ParseTasks.updateProgress(taskId, 78, 'Creating normal quality version...');
          sendTaskProgress(userId, taskId, 78, 'Creating normal quality version...', 'processing');
        }
        const normalPath = path.join(this.tempDir, `${songId}_normal.mp3`);
        const normalSuccess = await decreaseAudioBitrate(audioPath, normalPath, 'normal');
        if (normalSuccess) {
          if (taskId && userId) {
            await ParseTasks.updateProgress(taskId, 80, 'Uploading normal quality version...');
            sendTaskProgress(userId, taskId, 80, 'Uploading normal quality version...', 'processing');
          }
          results.normal = await mediaUploadService.uploadMedia(normalPath, `audio/${songId}n.mp3`);
        }

      } else if (detectedQuality === 'high') {
        // Original is high quality - create high and normal
        if (taskId && userId) {
          await ParseTasks.updateProgress(taskId, 65, 'Uploading high quality version...');
          sendTaskProgress(userId, taskId, 65, 'Uploading high quality version...', 'processing');
        }
        results.high = await mediaUploadService.uploadMedia(audioPath, `audio/${songId}h.mp3`);

        // Create normal quality version
        if (taskId && userId) {
          await ParseTasks.updateProgress(taskId, 75, 'Creating normal quality version...');
          sendTaskProgress(userId, taskId, 75, 'Creating normal quality version...', 'processing');
        }
        const normalPath = path.join(this.tempDir, `${songId}_normal.mp3`);
        const normalSuccess = await decreaseAudioBitrate(audioPath, normalPath, 'normal');
        if (normalSuccess) {
          if (taskId && userId) {
            await ParseTasks.updateProgress(taskId, 80, 'Uploading normal quality version...');
            sendTaskProgress(userId, taskId, 80, 'Uploading normal quality version...', 'processing');
          }
          results.normal = await mediaUploadService.uploadMedia(normalPath, `audio/${songId}n.mp3`);
        }

      } else if (detectedQuality === 'normal') {
        // Original is normal quality - only upload as normal
        if (taskId && userId) {
          await ParseTasks.updateProgress(taskId, 70, 'Uploading audio...');
          sendTaskProgress(userId, taskId, 70, 'Uploading audio...', 'processing');
        }
        results.normal = await mediaUploadService.uploadMedia(audioPath, `audio/${songId}n.mp3`);

      } else {
        // Unknown quality - treat as normal
        logger.warn(`Unknown audio quality detected, treating as normal`);
        if (taskId && userId) {
          await ParseTasks.updateProgress(taskId, 70, 'Uploading audio...');
          sendTaskProgress(userId, taskId, 70, 'Uploading audio...', 'processing');
        }
        results.normal = await mediaUploadService.uploadMedia(audioPath, `audio/${songId}n.mp3`);
      }

      const qualityCount = Object.keys(results).length;
      logger.info(`Successfully created ${qualityCount} quality version(s) for song ${songId}`);
      
      return results;

    } catch (error) {
      logger.error(`Error processing audio qualities for song ${songId}:`, error);
      // Fallback: at least upload the original as normal quality
      results.normal = await mediaUploadService.uploadMedia(audioPath, `audio/${songId}n.mp3`);
      return results;
    }
  }

  /**
   * Clean up temporary files
   */
  private cleanupTempFiles(): void {
    try {
      if (fs.existsSync(this.tempDir)) {
        const tempFiles = fs.readdirSync(this.tempDir);
        tempFiles.forEach(file => {
          const filePath = path.join(this.tempDir, file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
    } catch (error) {
      logger.warn('Failed to cleanup temp files:', error);
      // Don't throw - cleanup failures shouldn't break the main operation
    }
  }
}

// Export singleton instance
export const streamDownloader = new StreamDownloader();
