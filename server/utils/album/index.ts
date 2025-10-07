import type { H3Event } from "h3";
import type { ObjectId } from "mongodb";

const logger = BakaLogger.child({service: 'AlbumAPI'})

export const checkAlbumExists = async (albumId: ObjectId) => {
  const album = await Albums.findById(albumId);
  if (!album) {
    logger.warn('AlbumAPI: Album not found', { albumId });
    throw createError({ statusCode: 404, statusMessage: 'Album not found' });
  }
  return album;
}

export const checkAlbumReadAccess = async (event: H3Event, albumId: ObjectId) => {
  // For now, all albums are public for read access
  // This can be extended later if albums have privacy settings
  const album = await checkAlbumExists(albumId);
  return album;
}

export const checkAlbumEditAccess = async (event: H3Event, albumId: ObjectId) => {
  // For now, only admin users can edit albums
  // This can be extended later based on business requirements
  const userId = event.context.user?.id;
  if (!userId) {
    logger.warn('AlbumAPI: Unauthorized access attempt - no user', {albumId});
    throw createError({statusCode: 401, statusMessage: 'Authentication required'});
  }
  
  const album = await checkAlbumExists(albumId);
  
  // TODO: Implement proper authorization logic
  // For now, assuming all authenticated users can edit (this should be restricted)
  
  return album;
}
