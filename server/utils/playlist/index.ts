import type { H3Event } from "h3";
import type { ObjectId } from "mongodb";

const logger = BakaLogger.child({service: 'PlaylistAPI'})

export const checkPlaylistExists = async (playlistId: ObjectId) => {
  const playlist = await Playlists.findById(playlistId);
  if (!playlist) {
    logger.warn('PlaylistCoverAPI: Playlist not found', { playlistId });
    throw createError({ statusCode: 404, statusMessage: 'Playlist not found' });
  }
  return playlist;
}

export const checkPlaylistReadAccess = async (event: H3Event, playlistId: ObjectId) => {
  const userId = event.context.user?.id;
  const playlist = await checkPlaylistExists(playlistId);
  if (!await Playlists.hasReadAccess(playlistId, userId)) {
    logger.warn('PlaylistCoverAPI: Unauthorized access attempt', {playlistId, userId, ownerId: playlist.owner?.toString()});
    throw createError({statusCode: 403, statusMessage: 'You are not allowed to access this playlist'});
  }
  return playlist;
}

export const checkPlaylistOwnership = async (event: H3Event, playlistId: ObjectId) => {
  const userId = event.context.user?.id;
  const playlist = await checkPlaylistExists(playlistId);
  // Check ownership
  if (playlist.owner?.toString() !== userId) {
    logger.warn('PlaylistCoverAPI: Unauthorized access attempt', {playlistId, userId, ownerId: playlist.owner?.toString()});
    throw createError({statusCode: 403, statusMessage: 'You can only edit your own playlists'});
  }
  return playlist;
}
