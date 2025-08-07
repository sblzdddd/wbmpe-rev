import { z } from 'zod';
import { objectIdSchemaCoerced } from './common';

// -----------USER SCHEMAS-----------

export const simpleUserSchema = z.object({
  _id: z.string().meta({
    description: 'User ID',
    example: '6863722013b04be86cb7a555',
  }),
  userName: z.string().meta({
    description: 'Username',
    example: 'user123',
  }),
  nickName: z.string().meta({
    description: 'Display name',
    example: 'John Doe',
  }),
  avatarUrl: z.string().meta({
    description: 'Avatar image URL',
    example: 'https://example.com/avatar.jpg',
  }),
  bio: z.string().nullable().meta({
    description: 'User biography',
    example: 'Music lover and playlist curator',
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

export const userPlaylistsSchema = z.object({
  createdPlaylists: z.array(playlistMetaSchema).meta({
    description: 'User created playlists',
  }),
  favorites: playlistMetaSchema.nullable().meta({
    description: 'User favorites playlist',
  }),
  recent: playlistMetaSchema.nullable().meta({
    description: 'Recently played playlist',
  }),
});

export const userInfoSchema = simpleUserSchema.extend({
  createdPlaylists: z.array(playlistMetaSchema).optional().meta({
    description: 'User created playlists',
  }),
  favorites: playlistMetaSchema.nullable().optional().meta({
    description: 'User favorites playlist',
  }),
  recent: playlistMetaSchema.nullable().optional().meta({
    description: 'Recently played playlist',
  }),
});

// -----------REQUEST SCHEMAS-----------

export const userFavoritesUpdateRequest = z.object({
  songId: objectIdSchemaCoerced('Song ID').meta({
    description: 'The ID of the song',
    example: '6863722013b04be86cb7a555',
  }),
  set: z.boolean().meta({
    description: 'Whether to add (true) or remove (false) from favorites',
    example: true,
  }),
});

export const userQueueUpdateRequest = z.object({
  songs: z.array(z.object({
    songId: objectIdSchemaCoerced('Song ID').meta({
      description: 'The ID of the song',
      example: '6863722013b04be86cb7a555',
    }),
  })).optional().meta({
    description: 'Array of songs in the queue',
  }),
  currentIndex: z.number().min(0).optional().meta({
    description: 'Current playing index in the queue',
    example: 0,
  }),
  currentTime: z.number().min(0).optional().meta({
    description: 'Current playback time in seconds',
    example: 120.5,
  }),
});

// -----------RESPONSE SCHEMAS-----------

export const userMeResponse = simpleUserSchema;

export const userPlaylistsResponse = userPlaylistsSchema;

export const userFavoritesResponse = z.array(z.string()).meta({
  description: 'Array of favorite song IDs',
  example: ['6863722013b04be86cb7a555', '6863722013b04be86cb7a556'],
});

export const userQueueResponse = z.object({
  songs: z.array(z.object({
    songId: z.string().meta({
      description: 'Song ID',
      example: '6863722013b04be86cb7a555',
    }),
  })).meta({
    description: 'Array of songs in the queue',
  }),
  currentIndex: z.number().meta({
    description: 'Current playing index in the queue',
    example: 0,
  }),
  currentTime: z.number().meta({
    description: 'Current playback time in seconds',
    example: 120.5,
  }),
});

export const userInfoResponse = z.object({
  user: userInfoSchema,
});
