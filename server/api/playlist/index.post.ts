import { imageUploadService } from '../../utils/imageUpload';
import { makeid } from "../../utils/auth";
import Users from "../../models/Users";

const logger = BakaLogger.child({ service: 'PlaylistAPI' });

export default defineEventHandler(async (event) => {

  try {
    const userId = event.context.user?.id;
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    logger.info('PlaylistAPI: Creating new playlist', { userId });

    // Parse multipart form data for image upload support
    const form = await readMultipartFormData(event);
    if (!form) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No form data provided'
      });
    }

    // Extract fields from form data
    const nameField = form.find(item => item.name === 'name');
    const descriptionField = form.find(item => item.name === 'description');
    const isPublicField = form.find(item => item.name === 'isPublic');
    const imageFile = form.find(item => item.name === 'cover');

    // Validate required fields
    const name = nameField?.data?.toString('utf-8')?.trim();
    if (!name || name.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Playlist name is required'
      });
    }

    if (name.length > 24) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Playlist name must be 24 characters or less'
      });
    }

    const description = descriptionField?.data?.toString('utf-8')?.trim() || '';
    if (description && description.length > 500) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Description must be 500 characters or less'
      });
    }

    const isPublic = isPublicField?.data?.toString('utf-8') === 'true';

    // Handle optional image upload
    let coverUrl = '';
    if (imageFile && imageFile.data && imageFile.data.length > 0) {
      // Validate file size
      if (imageFile.data.length > 5 * 1024 * 1024) { // 5MB limit
        throw createError({
          statusCode: 400,
          statusMessage: 'File size too large. Maximum size is 5MB.'
        });
      }

      // Validate image type based on buffer
      const buffer = imageFile.data;
      const isValidImage = buffer.length > 0 && (
        buffer.subarray(0, 3).toString('hex') === 'ffd8ff' || // JPEG
        buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' || // PNG
        buffer.subarray(0, 6).toString() === 'GIF87a' || buffer.subarray(0, 6).toString() === 'GIF89a' || // GIF
        buffer.subarray(0, 4).toString() === 'RIFF' // WebP
      );

      if (!isValidImage) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid image format. Only JPEG, PNG, GIF, and WebP are supported.'
        });
      }

      // Generate temporary playlist ID for upload
      const tempId = makeid(24);
      const filename = imageFile.filename || 'cover.jpg';

      // Upload image to OSS
      const uploadResult = await imageUploadService.uploadPlaylistCover(
        buffer, 
        `${filename}-${makeid(10)}`, 
        tempId
      );
      coverUrl = uploadResult.url;
    }

    // Create playlist
    const playlist = await Users.createNewPlaylist(userId, name, description, coverUrl, isPublic);

    logger.info('PlaylistAPI: Playlist created successfully', { 
      playlistId: playlist._id, 
      userId,
      name,
      hasCover: !!coverUrl
    });

    return {
      success: true,
      data: {
        _id: playlist._id,
        name: playlist.name,
        description: playlist.description,
        coverUrl: playlist.coverUrl,
        isPublic: playlist.isPublic,
        owner: playlist.owner?.toString()
      }
    };

  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
      throw error;
    }

    logger.error('PlaylistAPI: Creation failed', { error });
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // TODO: Implement playlist listing for GET
  throw createError({
    statusCode: 501,
    statusMessage: 'Not implemented'
  });
});


defineRouteMeta({
  openAPI: {
    tags: ["Playlist"],
    description: "Create a new playlist",
    requestBody: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              name: { 
                type: 'string', 
                description: 'Playlist name (required, max 24 characters)' 
              },
              description: { 
                type: 'string', 
                description: 'Playlist description (optional, max 500 characters)' 
              },
              isPublic: { 
                type: 'boolean', 
                description: 'Whether the playlist is public (default: true)' 
              },
              cover: {
                type: 'string',
                format: 'binary',
                description: 'Cover image file (optional, max 5MB)'
              }
            },
            required: ['name']
          }
        }
      }
    },
    responses: {
      '201': {
        description: 'Playlist created successfully',
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
                    isPublic: { type: 'boolean' },
                    owner: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
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
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      }
    },
    $global: {
      components: {
        schemas: {
          PlaylistInfo: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              coverUrl: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              owner: { $ref: '#/components/schemas/SimpleUser' },
              createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
              updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
            }
          },
          PaginatedPlaylist: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              playlistType: { type: 'string', enum: ['playlist', 'favourite', 'recent'] },
              coverUrl: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              owner: { $ref: '#/components/schemas/SimpleUser' },
              songList: { $ref: '#/components/schemas/SongList' },
              createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
              updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
            }
          },
          PlaylistResponse: {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/PaginatedPlaylist' }
            }
          },
        }
      }
    },
  }
})
