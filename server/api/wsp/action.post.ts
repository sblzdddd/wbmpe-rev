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

  const body = await readBody(event);
  const { type, payload, roomId = 'WNFOSG' } = body;

  if (!type) {
     throw createError({ statusCode: 400, message: 'Missing type' });
  }

  let update: any = {};
  
  switch (type) {
      case 'PLAY':
          update.isPlaying = true;
          break;
      case 'PAUSE':
          update.isPlaying = false;
          if (typeof payload?.time === 'number') {
              update.currentTime = payload.time;
          }
          break;
      case 'SEEK':
          if (typeof payload?.time === 'number') {
              update.currentTime = payload.time;
          }
          break;
      case 'CHANGE_SONG':
          update.currentSong = payload.song;
          update.currentTime = 0;
          update.isPlaying = true;
          break;
      case 'UPDATE_QUEUE':
          update.queue = payload.songs;
          update.queueIndex = payload.currentIndex;
          break;
  }

  if (Object.keys(update).length > 0) {
      await WSPRooms.updateState(roomId, update);
  }

  wspManager.broadcast(roomId, { type, ...payload }, userId);

  return { success: true };
});
