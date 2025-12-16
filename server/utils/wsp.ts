import { H3Event } from 'h3';
import WSPRooms from '../models/WSPRooms';

interface WSPClient {
  id: string; // userId
  roomId: string;
  res: any;
}

class WSPManager {
  private clients: Map<string, WSPClient[]> = new Map(); // roomId -> clients[]

  addClient(roomId: string, userId: string, event: H3Event) {
    // Set headers for SSE
    event.node.res.setHeader('Content-Type', 'text/event-stream');
    event.node.res.setHeader('Cache-Control', 'no-cache');
    event.node.res.setHeader('Connection', 'keep-alive');
    event.node.res.flushHeaders();

    const client: WSPClient = {
      id: userId,
      roomId,
      res: event.node.res
    };

    if (!this.clients.has(roomId)) {
      this.clients.set(roomId, []);
    }
    this.clients.get(roomId)?.push(client);

    // Remove client on close
    event.node.req.on('close', () => {
      this.removeClient(roomId, userId, event.node.res);
    });

    return client;
  }

  removeClient(roomId: string, userId: string, res: any) {
    const roomClients = this.clients.get(roomId);
    if (!roomClients) return;

    const index = roomClients.findIndex(c => c.res === res); // Find exact connection (tab)
    if (index !== -1) {
      roomClients.splice(index, 1);
    }
    
    // Optional: Update DB presence if no more connections for this user?
    // For now we keep it simple.
  }

  broadcast(roomId: string, event: any, excludeUserId?: string) {
    const roomClients = this.clients.get(roomId);
    if (!roomClients) return;

    const data = `data: ${JSON.stringify(event)}\n\n`;

    roomClients.forEach(client => {
      if (excludeUserId && client.id === excludeUserId) return; // Don't echo back to sender if requested
      try {
        client.res.write(data);
      } catch (e) {
        console.error('Failed to send SSE', e);
      }
    });
  }
}

// Singleton
export const wspManager = new WSPManager();
