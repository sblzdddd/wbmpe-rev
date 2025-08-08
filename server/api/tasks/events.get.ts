// Removed unused ParseTasks import
import { connections, type TaskUpdate } from '../../utils/sse/parse_task_sse';

const logger = BakaLogger.child({service: 'TaskEventsAPI'});


// Cleanup connections older than 5 minutes
setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes
  
  for (const [connectionId, connection] of connections.entries()) {
    if (now - connection.lastHeartbeat > timeout) {
      logger.debug(`Cleaning up stale SSE connection: ${connectionId}`);
      connections.delete(connectionId);
    }
  }
}, 60000); // Check every minute

export default defineEventHandler(async (event) => {
  const user = await event.context.user?.id;
  
  // Set SSE headers
  setHeader(event, 'Content-Type', 'text/event-stream');
  setHeader(event, 'Cache-Control', 'no-cache');
  setHeader(event, 'Connection', 'keep-alive');
  setHeader(event, 'Access-Control-Allow-Origin', '*');
  setHeader(event, 'Access-Control-Allow-Headers', 'Cache-Control');

  const connectionId = `${user}_${Date.now()}_${Math.random()}`;
  
  // Store connection
  connections.set(connectionId, {
    res: event.node.res,
    userId: user,
    lastHeartbeat: Date.now()
  });

  logger.info(`SSE connection established for user ${user}: ${connectionId}`);

  // Send initial connection message
  event.node.res.write(`data: ${JSON.stringify({
    type: 'connected',
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Send heartbeat every 30 seconds
  const heartbeatInterval = setInterval(() => {
    const connection = connections.get(connectionId);
    if (connection) {
      try {
        connection.res.write(`data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        })}\n\n`);
        connection.lastHeartbeat = Date.now();
      } catch (_error) {
        logger.debug(`Failed to send heartbeat: ${_error}, removing connection: ${connectionId}`);
        clearInterval(heartbeatInterval);
        connections.delete(connectionId);
      }
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  // Handle connection close
  event.node.req.on('close', () => {
    logger.debug(`SSE connection closed: ${connectionId}`);
    clearInterval(heartbeatInterval);
    connections.delete(connectionId);
  });

  event.node.req.on('error', () => {
    logger.debug(`SSE connection error: ${connectionId}`);
    clearInterval(heartbeatInterval);
    connections.delete(connectionId);
  });

  // Keep the connection open
  return new Promise(() => {
    // This promise never resolves to keep the connection alive
  });
});

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
