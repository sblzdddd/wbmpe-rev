import type { IncomingMessage } from 'http';
import type { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import { verify } from 'jsonwebtoken';
import Users from '../models/Users';

const logger = BakaLogger.child({service: 'WebSocket'});

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

interface TaskProgressUpdate {
  type: 'task_progress';
  taskId: string;
  progress: number;
  message?: string;
  status: string;
}

interface TaskStatusUpdate {
  type: 'task_status';
  taskId: string;
  status: string;
  errorMessage?: string;
}

type WebSocketMessage = TaskProgressUpdate | TaskStatusUpdate;

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, Set<AuthenticatedWebSocket>>();
  public isInitialized = false;

  initialize(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/api/ws'
    });

    this.wss.on('connection', async (ws: AuthenticatedWebSocket, request: IncomingMessage) => {
      logger.debug('New WebSocket connection');
      
      // Extract token from query parameters
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        logger.warn('WebSocket connection attempted without token');
        ws.close(1008, 'Authentication required');
        return;
      }

      try {
        // Verify JWT token
        const decoded = verify(token, process.env.NUXT_JWT_SECRET!) as any;
        const user = await Users.findById(decoded.userId);
        
        if (!user) {
          logger.warn('WebSocket connection with invalid user');
          ws.close(1008, 'Invalid user');
          return;
        }

        ws.userId = user._id.toString();
        ws.isAlive = true;

        // Add client to user's connection set
        if (!this.clients.has(ws.userId)) {
          this.clients.set(ws.userId, new Set());
        }
        this.clients.get(ws.userId)!.add(ws);

        logger.info(`WebSocket authenticated for user: ${ws.userId}`);

        // Handle pong messages for heartbeat
        ws.on('pong', () => {
          ws.isAlive = true;
        });

        // Handle connection close
        ws.on('close', () => {
          this.removeClient(ws);
        });

        // Handle errors
        ws.on('error', (error) => {
          logger.error('WebSocket error:', error);
          this.removeClient(ws);
        });

      } catch (error) {
        logger.warn('WebSocket authentication failed:', error);
        ws.close(1008, 'Authentication failed');
      }
    });

    // Heartbeat interval to keep connections alive
    const heartbeatInterval = setInterval(() => {
      this.wss?.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          this.removeClient(ws);
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds

    this.wss.on('close', () => {
      clearInterval(heartbeatInterval);
    });

    this.isInitialized = true;
    logger.info('WebSocket server initialized');
  }

  private removeClient(ws: AuthenticatedWebSocket) {
    if (ws.userId) {
      const userClients = this.clients.get(ws.userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(ws.userId);
        }
      }
      logger.debug(`Removed WebSocket client for user: ${ws.userId}`);
    }
  }

  // Send message to specific user
  sendToUser(userId: string, message: WebSocketMessage) {
    const userClients = this.clients.get(userId);
    if (!userClients) {
      logger.debug(`No WebSocket clients found for user: ${userId}`);
      return;
    }

    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    userClients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(messageStr);
        sentCount++;
      } else {
        this.removeClient(client);
      }
    });

    logger.debug(`Sent message to ${sentCount} clients for user: ${userId}`);
  }

  // Send task progress update
  sendTaskProgress(userId: string, taskId: string, progress: number, message?: string, status = 'downloading') {
    this.sendToUser(userId, {
      type: 'task_progress',
      taskId,
      progress,
      message,
      status
    });
  }

  // Send task status update
  sendTaskStatus(userId: string, taskId: string, status: string, errorMessage?: string) {
    this.sendToUser(userId, {
      type: 'task_status',
      taskId,
      status,
      errorMessage
    });
  }

  // Get connected client count for a user
  getUserClientCount(userId: string): number {
    return this.clients.get(userId)?.size || 0;
  }

  // Get total connected clients
  getTotalClients(): number {
    return Array.from(this.clients.values()).reduce((total, clients) => total + clients.size, 0);
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export type { WebSocketMessage, TaskProgressUpdate, TaskStatusUpdate };
