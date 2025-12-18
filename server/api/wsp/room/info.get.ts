import WSPRooms from '../../../models/WSPRooms';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const name = query.name as string;

  if (!name) {
    throw createError({
      statusCode: 400,
      message: 'Room name is required'
    });
  }

  const room = await WSPRooms.findOne({ name }).populate('participants', 'userName avatarUrl');
  
  if (!room) {
      throw createError({
          statusCode: 404,
          message: 'Room not found'
      });
  }

  return {
      name: room.name,
      participants: room.participants,
      isPlaying: room.state.isPlaying,
      currentSong: room.state.currentSong
  };
});
