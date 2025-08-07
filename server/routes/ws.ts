import { websocketService } from '../utils/websocket';

const logger = BakaLogger.child({service: 'WebSocketRoute'});

export default defineEventHandler({
  onRequest: async (event) => {
    // Handle WebSocket upgrade
    if (event.node.req.headers.upgrade === 'websocket') {
      try {
        // Get the HTTP server from the event
        const server = event.node.req.socket.server;
        
        if (server && !websocketService.isInitialized) {
          logger.info('Initializing WebSocket server');
          websocketService.initialize(server);
        }
      } catch (error) {
        logger.error('Failed to handle WebSocket upgrade:', error);
      }
    }
  },
  handler: async (event) => {
    // This shouldn't be reached for WebSocket connections
    // but provide a fallback response
    return {
      message: 'WebSocket endpoint - use WebSocket protocol',
      status: 'error'
    };
  }
});
