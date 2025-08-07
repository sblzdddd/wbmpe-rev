import { z } from 'zod';
import { paginationQuerySchema, paginationResponseSchema } from './common';

// -----------ARTIST SCHEMAS-----------

export const simpleArtistSchema = z.object({
  _id: z.string().meta({
    description: 'Artist ID',
    example: '6863722013b04be86cb7a555',
  }),
  name: z.string().meta({
    description: 'Artist name',
    example: 'The Beatles',
  }),
  avatarUrl: z.string().meta({
    description: 'Artist avatar image URL',
    example: 'https://example.com/artist-avatar.jpg',
  }),
  bio: z.string().optional().meta({
    description: 'Artist biography',
    example: 'Legendary British rock band',
  }),
});

export const artistDetailSchema = simpleArtistSchema.extend({
  albumCount: z.number().meta({
    description: 'Number of albums',
    example: 13,
  }),
  songCount: z.number().meta({
    description: 'Number of songs',
    example: 213,
  }),
  followers: z.number().optional().meta({
    description: 'Number of followers',
    example: 1000000,
  }),
  verified: z.boolean().optional().meta({
    description: 'Whether the artist is verified',
    example: true,
  }),
});

// -----------REQUEST SCHEMAS-----------

export const artistListRequest = paginationQuerySchema;

export const artistIdParam = z.string().meta({
  description: 'Artist ID',
  example: '6863722013b04be86cb7a555',
  param: { in: 'path', name: 'id', required: true },
});

// -----------RESPONSE SCHEMAS-----------

export const artistListResponse = z.object({
  data: z.array(simpleArtistSchema).meta({
    description: 'Array of artists',
  }),
  pagination: paginationResponseSchema,
});

export const artistResponse = z.object({
  data: artistDetailSchema,
});
