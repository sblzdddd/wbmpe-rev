import Playlists from "~~/server/models/Playlists";
import Users from "../../../models/Users";
import { isValidObjectIdString } from '../../../utils/IdValidator';
import { ObjectId } from "mongodb";
import BakaLogger from "~~/server/utils/BakaLogger";
import { imageUploadService } from "~~/server/utils/imageUpload";

const logger = BakaLogger.child({ service: 'PlaylistDeleteAPI' });

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id;
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    const id = getRouterParam(event, 'id');
    const playlistId = id as string;

    if (!isValidObjectIdString(playlistId)) {
      logger.warn(`PlaylistDeleteAPI: Invalid playlist ID ${playlistId}`);
      throw createError({
        statusCode: 404,
        statusMessage: 'Playlist not found'
      });
    }
    const playlist = await Playlists.findById(playlistId);
    if (!playlist) {
      logger.warn(`PlaylistDeleteAPI: Playlist ${playlistId} not found`);
      throw createError({
        statusCode: 404,
        statusMessage: 'Playlist not found'
      });
    }

    logger.info(`PlaylistDeleteAPI: Deleting playlist ${playlistId}`);

    try {
      if (playlist.coverUrl) {
        try {
          await imageUploadService.deleteImage(playlist.coverUrl);
        } catch (error) {
          logger.warn('PlaylistDeleteAPI: Failed to delete playlist cover image', { error });
        }
      }
      await Users.deletePlaylist(new ObjectId(userId), new ObjectId(playlistId));
    } catch (modelError: unknown) {
      // Handle specific errors from the Users.deletePlaylist method
      if (modelError instanceof Error && modelError.message === 'User not found') {
        logger.warn('PlaylistDeleteAPI: User not found', { userId });
        throw createError({
          statusCode: 404,
          statusMessage: 'User not found'
        });
      } else if (modelError instanceof Error && modelError.message === 'Playlist not found') {
        logger.warn('PlaylistDeleteAPI: Playlist not found', { playlistId });
        throw createError({
          statusCode: 404,
          statusMessage: 'Playlist not found'
        });
      } else if (modelError instanceof Error && modelError.message === 'Unauthorized: User does not own this playlist') {
        logger.warn('PlaylistDeleteAPI: Unauthorized delete attempt', { playlistId, userId });
        throw createError({
          statusCode: 403,
          statusMessage: 'You can only delete your own playlists'
        });
      } else {
        // Re-throw other errors to be handled by the outer catch
        throw modelError;
      }
    }

    logger.info(`PlaylistDeleteAPI: Playlist ${playlistId} deleted successfully`);

    return {
      success: true,
      message: 'Playlist deleted successfully'
    };

  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
      throw error;
    }

    logger.error('PlaylistDeleteAPI: Delete failed', { error });
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

defineRouteMeta({
  openAPI: {
    tags: ["Playlist"],
    description: "Delete a playlist",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: 'string' } }
    ],
    responses: {
      '200': {
        description: 'Playlist deleted successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                message: { type: 'string' }
              }
            }
          }
        }
      },
      '401': {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      },
      '403': {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      },
      '404': {
        description: 'Playlist not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      }
    }
  }
});
