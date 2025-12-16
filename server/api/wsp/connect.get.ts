import { wspManager } from '../../utils/wsp';
import WSPRooms from '../../models/WSPRooms';

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id

  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated'
    })
  }

  const query = getQuery(event);
  const roomId = (query.roomId as string) || 'UNKNOWN'; // Default room for now

  // Ensure room exists
  const room = await WSPRooms.getOrCreateRoom(roomId, userId);
  await WSPRooms.addParticipant(roomId, userId);
  wspManager.addClient(roomId, userId, event);

  const initialEvent = {
    type: 'SYNC_RESPONSE',
    state: room.state
  };
  
  event.node.res.write(`data: ${JSON.stringify(initialEvent)}\n\n`);

  // Keep connection open
  return new Promise(() => {
  });
});
