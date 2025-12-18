import WSPRooms from '../../../models/WSPRooms';

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated'
    })
  }

  const body = await readBody(event);
  const { name } = body;

  if (!name || typeof name !== 'string' || name.length < 3) {
      throw createError({
          statusCode: 400,
          message: 'Invalid room name (min 3 chars)'
      });
  }

  try {
      const room = await WSPRooms.getOrCreateRoom(name, userId);
      return {
          roomId: room.name,
          name: room.name,
          participants: room.participants.length
      };
  } catch (e: any) {
      throw createError({
          statusCode: 500,
          message: e.message
      });
  }
});
