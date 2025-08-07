import { websocketService } from '../utils/websocket';

const logger = BakaLogger.child({service: 'WebSocketPlugin'});

export default async () => {
  try {
    // Initialize WebSocket service during server startup
    logger.info('Initializing WebSocket service...');
    
    // We need to get the HTTP server instance to attach WebSocket
    // This will be available in the Nitro app context
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'development') {
      // In production, we'll initialize WebSocket in the server startup
      logger.info('WebSocket will be initialized when HTTP server is ready');
    } else {
      logger.info('WebSocket initialization deferred for development mode');
    }
    
  } catch (error) {
    logger.error('Failed to initialize WebSocket service:', error);
  }
};
