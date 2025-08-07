import { z } from 'zod';
import { objectIdSchemaCoerced, imageFileSchemaCoerced, formBooleanSchemaCoerced, successResponseSchema } from './common';
import { simpleUserSchema } from './user';

// -----------PLAYLIST SCHEMAS-----------

export const timeMetadataSchema = z.object({
  createdAt: z.string().meta({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  }),
  updatedAt: z.string().meta({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00.000Z',
  }),
});

export const playlistMetaSchema = z.object({
  _id: z.string().meta({
    description: 'Playlist ID',
    example: '6863722013b04be86cb7a555',
  }),
  coverUrl: z.string().nullable().meta({
    description: 'Playlist cover image URL',
    example: 'https://example.com/cover.jpg',
  }),
  name: z.string().meta({
    description: 'Playlist name',
    example: 'My Favorites',
  }),
  isPublic: z.boolean().meta({
    description: 'Whether the playlist is public',
    example: true,
  }),
});

export const playlistInfoSchema = z.object({
  _id: z.string().meta({
    description: 'Playlist ID',
    example: '6863722013b04be86cb7a555',
  }),
  playlistType: z.enum(['playlist', 'favorites', 'recent']).meta({
    description: 'Type of playlist',
    example: 'playlist',
  }),
  coverUrl: z.string().meta({
    description: 'Playlist cover image URL',
    example: 'https://example.com/cover.jpg',
  }),
  name: z.string().meta({
    description: 'Playlist name',
    example: 'My Playlist',
  }),
  description: z.string().meta({
    description: 'Playlist description',
    example: 'This is my playlist',
  }),
  isPublic: z.boolean().meta({
    description: 'Whether the playlist is public',
    example: true,
  }),
  owner: simpleUserSchema,
}).merge(timeMetadataSchema);

export const songListSchema = z.object({
  data: z.array(z.any()).meta({
    description: 'Array of songs',
  }),
  pagination: z.object({
    page: z.number().meta({
      description: 'Current page',
      example: 1,
    }),
    limit: z.number().meta({
      description: 'Items per page',
      example: 100,
    }),
    total: z.number().meta({
      description: 'Total items',
      example: 150,
    }),
    totalPage: z.number().meta({
      description: 'Total pages',
      example: 2,
    }),
  }),
});

export const paginatedPlaylistSchema = playlistInfoSchema.extend({
  songList: songListSchema,
});

// -----------PARAMETER SCHEMAS-----------

export const playlistIdParams = z.object({
  id: objectIdSchemaCoerced("Playlist ID")
});

export const playlistIdParam = playlistIdParams.pick({ id: true }).meta({
  description: 'Playlist ID',
  param: { in: 'path', name: 'id', required: true },
});

// -----------REQUEST SCHEMAS-----------

export const PlaylistCreateRequest = z.object({
  name: z.string().min(1, 'Playlist name is required').max(24, 'Playlist name must be 24 characters or less').meta({
    description: 'The name of the playlist',
    example: 'My Playlist',
  }),
  description: z.string().max(100, 'Description must be 100 characters or less').optional().meta({
    description: 'The description of the playlist',
    example: 'This is my playlist',
  }),
  isPublic: formBooleanSchemaCoerced.meta({
    description: 'Whether the playlist is public',
    example: true,
  }),
  cover: imageFileSchemaCoerced("Cover Image", 5 * 1024 * 1024).meta({
    description: 'The cover image of the playlist',
    example: '[no example]',
    override: {
      type: 'string',
      format: 'binary',
    }
  }).optional(),
});

export const PlaylistInfoUpdateRequest = z.object({
  name: z.string().max(24).optional().meta({
    description: 'The name of the playlist',
    example: 'My Playlist',
  }),
  description: z.string().max(100).optional().meta({
    description: 'The description of the playlist',
    example: 'This is my playlist',
  }),
  coverUrl: z.url().optional().meta({
    description: 'The URL of the playlist cover',
    example: 'https://example.com/cover.jpg',
  }),
  isPublic: z.boolean().optional().meta({
    description: 'Whether the playlist is public',
    example: true,
  }),
});

export const PlaylistCoverUpdateRequest = z.object({
  cover: imageFileSchemaCoerced("Cover Image", 5 * 1024 * 1024).meta({
    description: 'The cover image of the playlist',
    example: '[no example]',
  }),
});

// -----------RESPONSE SCHEMAS-----------

export const PlaylistResponse = z.object({
  data: paginatedPlaylistSchema,
});

export const PlaylistCreateResponse = z.object({
  success: z.boolean().meta({
    description: 'Whether the operation was successful',
    example: true,
  }),
  data: z.object({
    _id: z.string().meta({
      description: 'Playlist ID',
      example: '6863722013b04be86cb7a555',
    }),
    name: z.string().meta({
      description: 'Playlist name',
      example: 'My Playlist',
    }),
    description: z.string().meta({
      description: 'Playlist description',
      example: 'This is my playlist',
    }),
    coverUrl: z.string().meta({
      description: 'Cover image URL',
      example: 'https://example.com/cover.jpg',
    }),
    isPublic: z.boolean().meta({
      description: 'Whether playlist is public',
      example: true,
    }),
    owner: z.string().meta({
      description: 'Owner user ID',
      example: '6863722013b04be86cb7a555',
    }),
  }),
});

export const PlaylistUpdateResponse = z.object({
  success: z.boolean().meta({
    description: 'Whether the operation was successful',
    example: true,
  }),
  data: z.object({
    _id: z.string().meta({
      description: 'Playlist ID',
      example: '6863722013b04be86cb7a555',
    }),
    name: z.string().meta({
      description: 'Playlist name',
      example: 'My Playlist',
    }),
    description: z.string().meta({
      description: 'Playlist description',
      example: 'This is my playlist',
    }),
    coverUrl: z.string().meta({
      description: 'Cover image URL',
      example: 'https://example.com/cover.jpg',
    }),
    isPublic: z.boolean().meta({
      description: 'Whether playlist is public',
      example: true,
    }),
  }),
});

export const PlaylistCoverUploadResponse = z.object({
  success: z.boolean().meta({
    description: 'Whether the upload was successful',
    example: true,
  }),
  data: z.object({
    coverUrl: z.string().meta({
      description: 'New cover image URL',
      example: 'https://example.com/cover.jpg',
    }),
    path: z.string().meta({
      description: 'File path',
      example: '/uploads/covers/cover.jpg',
    }),
    name: z.string().meta({
      description: 'File name',
      example: 'cover.jpg',
    }),
  }),
});

export const PlaylistDeleteResponse = successResponseSchema.extend({
  message: z.string().meta({
    description: 'Success message',
    example: 'Playlist deleted successfully',
  }),
});

export const PlaylistListResponse = z.object({
  data: z.array(playlistMetaSchema).meta({
    description: 'Array of user playlists',
  }),
});

// Legacy exports for backward compatibility
export const PlaylistRequestParamsInternal = playlistIdParam;
