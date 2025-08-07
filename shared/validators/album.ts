import { z } from 'zod';
import { paginationQuerySchema, paginationResponseSchema } from './common';

// -----------ALBUM SCHEMAS-----------

export const simpleAlbumSchema = z.object({
  _id: z.string().meta({
    description: 'Album ID',
    example: '6863722013b04be86cb7a555',
  }),
  name: z.string().meta({
    description: 'Album name',
    example: 'Greatest Hits',
  }),
  coverUrl: z.string().meta({
    description: 'Album cover image URL',
    example: 'https://example.com/album-cover.jpg',
  }),
  artist: z.string().meta({
    description: 'Artist name',
    example: 'The Beatles',
  }),
  releaseDate: z.string().optional().meta({
    description: 'Release date',
    example: '2023-01-01',
  }),
});

export const albumDetailSchema = simpleAlbumSchema.extend({
  description: z.string().optional().meta({
    description: 'Album description',
    example: 'A collection of the greatest hits',
  }),
  genre: z.string().optional().meta({
    description: 'Album genre',
    example: 'Rock',
  }),
  trackCount: z.number().meta({
    description: 'Number of tracks in the album',
    example: 12,
  }),
  duration: z.number().optional().meta({
    description: 'Total duration in seconds',
    example: 2400,
  }),
});

// -----------REQUEST SCHEMAS-----------

export const albumListRequest = paginationQuerySchema;

export const albumIdParam = z.string().meta({
  description: 'Album ID',
  example: '6863722013b04be86cb7a555',
  param: { in: 'path', name: 'id', required: true },
});

// -----------RESPONSE SCHEMAS-----------

export const albumListResponse = z.object({
  data: z.array(simpleAlbumSchema).meta({
    description: 'Array of albums',
  }),
  pagination: paginationResponseSchema,
});

export const albumResponse = z.object({
  data: albumDetailSchema,
});
