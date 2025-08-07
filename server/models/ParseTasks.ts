import mongoose from "mongoose";
import { ObjectId } from "mongodb";

export type TaskStatus = 'pending' | 'downloading' | 'processing' | 'completed' | 'failed';

export type ParseTaskDocument = {
  _id: ObjectId;
  userId: ObjectId;
  songId: ObjectId;
  songName: string;
  artistName: string;
  albumName: string;
  status: TaskStatus;
  progress: number; // 0-100
  progressMessage?: string;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
} & TimeMetadata;

interface ParseTaskModel extends mongoose.Model<ParseTaskDocument> {
  createTask(userId: string, songData: {
    songId: string;
    songName: string;
    artistName: string;
    albumName: string;
  }): Promise<ParseTaskDocument>;
  updateProgress(taskId: string, progress: number, message?: string): Promise<void>;
  updateStatus(taskId: string, status: TaskStatus, errorMessage?: string): Promise<void>;
  getUserTasks(userId: string, limit?: number): Promise<ParseTaskDocument[]>;
  completeTask(taskId: string): Promise<void>;
}

const parseTaskSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: 'Users', required: true },
  songId: { type: ObjectId, required: true },
  songName: { type: String, required: true },
  artistName: { type: String, required: true },
  albumName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'downloading', 'processing', 'completed', 'failed'],
    default: 'pending',
    required: true 
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  progressMessage: { type: String },
  errorMessage: { type: String },
  startedAt: { type: Date },
  completedAt: { type: Date }
}, {
  timestamps: true
});

// Create indexes for better query performance
parseTaskSchema.index({ userId: 1, createdAt: -1 });
parseTaskSchema.index({ status: 1 });
parseTaskSchema.index({ songId: 1 });

const ParseTasks = mongoose.model<ParseTaskDocument, ParseTaskModel>('ParseTasks', parseTaskSchema);

// Static methods
ParseTasks.createTask = async function(userId: string, songData) {
  const task = await this.create({
    userId: new ObjectId(userId),
    songId: new ObjectId(songData.songId),
    songName: songData.songName,
    artistName: songData.artistName,
    albumName: songData.albumName,
    status: 'pending',
    progress: 0
  });
  
  return task;
};

ParseTasks.updateProgress = async function(taskId: string, progress: number, message?: string) {
  await this.findByIdAndUpdate(taskId, {
    progress: Math.min(100, Math.max(0, progress)),
    progressMessage: message,
    ...(progress > 0 && { startedAt: new Date() })
  });
};

ParseTasks.updateStatus = async function(taskId: string, status: TaskStatus, errorMessage?: string) {
  const updateData: any = { status };
  
  if (status === 'failed' && errorMessage) {
    updateData.errorMessage = errorMessage;
    updateData.completedAt = new Date();
  }
  
  if (status === 'downloading' || status === 'processing') {
    updateData.startedAt = new Date();
  }
  
  await this.findByIdAndUpdate(taskId, updateData);
};

ParseTasks.getUserTasks = async function(userId: string, limit = 10) {
  return await this.find({ userId: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

ParseTasks.completeTask = async function(taskId: string) {
  await this.findByIdAndUpdate(taskId, {
    status: 'completed',
    progress: 100,
    completedAt: new Date()
  });
};

const logger = BakaLogger.child({service: 'ParseTasks'});
logger.debug('ParseTasks model loaded');

export default ParseTasks;
