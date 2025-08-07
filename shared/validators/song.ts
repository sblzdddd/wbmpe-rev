import { z } from 'zod';
import { objectIdSchemaCoerced, paginationQuerySchema, paginationResponseSchema } from './common';

// -----------SONG SCHEMAS-----------

export const simpleSongSchema = z.object({
  _id: z.string().meta({
    description: 'Song ID',
    example: '6863722013b04be86cb7a555',
  }),
  name: z.string().meta({
    description: 'Song title',
    example: 'Hey Jude',
  }),
  artist: z.string().meta({
    description: 'Artist name',
    example: 'The Beatles',
  }),
  album: z.string().optional().meta({
    description: 'Album name',
    example: 'The Beatles 1967-1970',
  }),
  coverUrl: z.string().meta({
    description: 'Song cover image URL',
    example: 'https://example.com/song-cover.jpg',
  }),
  duration: z.number().meta({
    description: 'Song duration in seconds',
    example: 431,
  }),
  platform: z.string().meta({
    description: 'Source platform',
    example: 'netease',
  }),
});

export const songDetailSchema = simpleSongSchema.extend({
  lyrics: z.string().optional().meta({
    description: 'Song lyrics',
    example: 'Hey Jude, don\'t make it bad...',
  }),
  genre: z.string().optional().meta({
    description: 'Song genre',
    example: 'Rock',
  }),
  releaseDate: z.string().optional().meta({
    description: 'Release date',
    example: '1968-08-26',
  }),
  playCount: z.number().optional().meta({
    description: 'Play count',
    example: 1000000,
  }),
});

export const songStreamSchema = z.object({
  url: z.string().meta({
    description: 'Stream URL',
    example: 'https://example.com/stream/song.mp3',
  }),
  quality: z.string().meta({
    description: 'Audio quality',
    example: '320kbps',
  }),
  format: z.string().meta({
    description: 'Audio format',
    example: 'mp3',
  }),
});

export const songStreamResponseSchema = z.object({
  streams: z.array(songStreamSchema).meta({
    description: 'Available streams',
  }),
  defaultQuality: z.string().meta({
    description: 'Default quality',
    example: '320kbps',
  }),
});

export const unparsedSongSchema = z.object({
  name: z.string().meta({
    description: 'Song name',
    example: 'Hey Jude',
  }),
  artist: z.string().meta({
    description: 'Artist name',
    example: 'The Beatles',
  }),
  album: z.string().optional().meta({
    description: 'Album name',
    example: 'The Beatles 1967-1970',
  }),
  coverUrl: z.string().meta({
    description: 'Cover image URL',
    example: 'https://example.com/cover.jpg',
  }),
  duration: z.number().meta({
    description: 'Duration in seconds',
    example: 431,
  }),
  platform: z.string().meta({
    description: 'Source platform',
    example: 'netease',
  }),
  platformId: z.string().meta({
    description: 'Platform-specific ID',
    example: '123456',
  }),
});

// -----------REQUEST SCHEMAS-----------

export const songListRequest = paginationQuerySchema;

export const songIdParam = objectIdSchemaCoerced('Song ID').meta({
  description: 'Song ID',
  example: '6863722013b04be86cb7a555',
  param: { in: 'path', name: 'id', required: true },
});

// -----------RESPONSE SCHEMAS-----------

export const songListResponse = z.object({
  data: z.array(simpleSongSchema).meta({
    description: 'Array of songs',
  }),
  pagination: paginationResponseSchema,
});

export const songResponse = z.object({
  data: songDetailSchema,
});

export const songParseResponse = z.object({
  data: songStreamResponseSchema,
});

export const songStreamResponse = z.object({
  data: z.array(songStreamSchema),
});
