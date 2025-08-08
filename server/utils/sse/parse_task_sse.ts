import type { ServerResponse } from 'http';
import BakaLogger from '../logger/BakaLogger';


// Store active SSE connections
export const connections = new Map<string, {
  res: ServerResponse;
  userId: string;
  lastHeartbeat: number;
}>();


export interface TaskProgressUpdate {
  type: 'task_progress';
  taskId: string;
  progress: number;
  message?: string;
  status: string;
  timestamp?: string;
}

export interface TaskStatusUpdate {
  type: 'task_status';
  taskId: string;
  status: string;
  errorMessage?: string;
  timestamp?: string;
}

export type TaskUpdate = TaskProgressUpdate | TaskStatusUpdate;

const logger = BakaLogger.child({service: 'ParseTaskSSE'});

// Helper function to send updates to specific user
export function sendTaskUpdateToUser(userId: string, data: TaskUpdate) {
  const userConnections = Array.from(connections.entries())
    .filter(([_, connection]) => connection.userId === userId);
  
  if (userConnections.length === 0) {
    logger.debug(`No SSE connections found for user: ${userId}`);
    return;
  }

  const message = `data: ${JSON.stringify(data)}\n\n`;
  let sentCount = 0;

  userConnections.forEach(([connectionId, connection]) => {
    try {
      connection.res.write(message);
      connection.lastHeartbeat = Date.now();
      sentCount++;
    } catch (_error) {
      logger.debug(`Failed to send to connection ${connectionId}, removing: ${_error}`);
      connections.delete(connectionId);
    }
  });

  logger.debug(`Sent task update to ${sentCount} SSE connections for user: ${userId}`);
}

// Helper function to send task progress
export function sendTaskProgress(userId: string, taskId: string, progress: number, message?: string, status = 'downloading') {
  sendTaskUpdateToUser(userId, {
    type: 'task_progress',
    taskId,
    progress,
    message,
    status,
    timestamp: new Date().toISOString()
  });
}

// Helper function to send task status
export function sendTaskStatus(userId: string, taskId: string, status: string, errorMessage?: string) {
  sendTaskUpdateToUser(userId, {
    type: 'task_status',
    taskId,
    status,
    errorMessage,
    timestamp: new Date().toISOString()
  });
}
