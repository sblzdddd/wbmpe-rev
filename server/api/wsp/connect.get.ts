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
  const roomId = query.roomId as string;

  if (!roomId) {
    throw createError({
      statusCode: 400,
      message: 'Room ID is required'
    });
  }

  // Ensure room exists
  const room = await WSPRooms.findOne({ name: roomId }); 
  if (!room) {
    throw createError({
      statusCode: 404,
      message: 'Room not found'
    });
  }

  await WSPRooms.addParticipant(roomId, userId);
  wspManager.addClient(roomId, userId, event);

  // Broadcast join
  const updatedRoom = await WSPRooms.findOne({ name: roomId }).populate('participants', 'userName avatarUrl');
  if (updatedRoom) {
      wspManager.broadcast(roomId, {
          type: 'UPDATE_PARTICIPANTS',
          participants: updatedRoom.participants
      });
  }

  // Clean up on disconnect
  event.node.req.on('close', async () => {
     await WSPRooms.removeParticipant(roomId, userId);
     const leftRoom = await WSPRooms.findOne({ name: roomId }).populate('participants', 'userName avatarUrl');
     if (leftRoom) {
        wspManager.broadcast(roomId, {
            type: 'UPDATE_PARTICIPANTS',
            participants: leftRoom.participants
        });
     }
  });

  const initialEvent = {
    type: 'SYNC_RESPONSE',
    state: room.state
  };
  
  event.node.res.write(`data: ${JSON.stringify(initialEvent)}\n\n`);

  // Keep connection open
  return new Promise(() => {
  });
});
