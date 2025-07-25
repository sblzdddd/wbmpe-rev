import Playlists from "../../models/Playlists";
import { isValidObjectIdString } from '../../utils/IdValidator';
import { imageUploadService } from '../../utils/imageUpload';

const logger = BakaLogger.child({ service: 'PlaylistUpdateAPI' });

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
      logger.warn(`PlaylistUpdateAPI: Invalid playlist ID ${playlistId}`);
      throw createError({
        statusCode: 404,
        statusMessage: 'Playlist not found'
      });
    }

    logger.info(`PlaylistUpdateAPI: Updating playlist ${playlistId}`);

    // Find playlist and verify ownership
    const playlist = await Playlists.findById(playlistId);
    if (!playlist) {
      logger.warn(`PlaylistUpdateAPI: Playlist ${playlistId} not found`);
      throw createError({
        statusCode: 404,
        statusMessage: 'Playlist not found'
      });
    }

    // Check ownership
    if (playlist.owner?.toString() !== userId) {
      logger.warn('PlaylistUpdateAPI: Unauthorized access attempt', { 
        playlistId, 
        userId, 
        ownerId: playlist.owner?.toString() 
      });
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only edit your own playlists'
      });
    }

    // Parse request body
    const body = await readBody(event);
    const { name, description, coverUrl, isPublic } = body;

    // Validate provided fields
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Playlist name cannot be empty'
        });
      }

      if (name.length > 24) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Playlist name must be 24 characters or less'
        });
      }
    }

    if (description !== undefined && description.length > 500) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Description must be 500 characters or less'
      });
    }

    // Build update data with only provided fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    // Only update name if provided
    if (name !== undefined) {
      updateData.name = name.trim();
    }

    // Only update description if provided
    if (description !== undefined) {
      updateData.description = description || '';
    }

    // Only update isPublic if provided
    if (isPublic !== undefined) {
      updateData.isPublic = Boolean(isPublic);
    }

    // Handle cover URL update
    if (coverUrl !== undefined) {
      // If coverUrl is empty string, remove the cover
      if (coverUrl === '') {
        // Delete old cover if it exists
        if (playlist.coverUrl) {
          await imageUploadService.deleteImage(playlist.coverUrl);
        }
        updateData.coverUrl = '';
      } else if (coverUrl && typeof coverUrl === 'string') {
        // Update with new cover URL
        updateData.coverUrl = coverUrl;
      }
    }

    // Update the playlist
    const updatedPlaylist = await Playlists.findByIdAndUpdate(
      playlistId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPlaylist) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update playlist'
      });
    }

    logger.info(`PlaylistUpdateAPI: Playlist ${playlistId} updated successfully`);

    return {
      success: true,
      data: {
        _id: updatedPlaylist._id,
        name: updatedPlaylist.name,
        description: updatedPlaylist.description,
        coverUrl: updatedPlaylist.coverUrl,
        isPublic: updatedPlaylist.isPublic
      }
    };

  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
      throw error;
    }

    logger.error('PlaylistUpdateAPI: Update failed', { error });
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
    description: "Update a playlist's metadata (partial updates supported)",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: 'string' } }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Playlist name (optional for partial update)' },
              description: { type: 'string', description: 'Playlist description (optional for partial update)' },
              coverUrl: { type: 'string', description: 'Cover image URL (empty string to remove, optional for partial update)' },
              isPublic: { type: 'boolean', description: 'Whether the playlist is public (optional for partial update)' }
            },

          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Successful update',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    coverUrl: { type: 'string' },
                    isPublic: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      },
      '400': {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
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