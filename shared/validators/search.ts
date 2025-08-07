import { z } from 'zod';
import { unparsedSongSchema, simpleSongSchema } from './song';

// -----------SEARCH SCHEMAS-----------

export const bilibiliPageSchema = z.object({
  thumb: z.string().meta({
    description: 'Page thumbnail URL',
    example: 'https://example.com/thumb.jpg',
  }),
  name: z.string().meta({
    description: 'Page title',
    example: 'Part 1',
  }),
  page: z.number().meta({
    description: 'Page number',
    example: 1,
  }),
});

// -----------REQUEST SCHEMAS-----------

export const searchSongRequest = z.object({
  keyword: z.string().min(1, 'Keyword is required').meta({
    description: 'The keyword to search for',
    example: 'hey jude',
  }),
  page: z.coerce.number().min(1, 'Page must be at least 1').meta({
    description: 'The page number',
    example: 1,
  }),
});

export const searchSuggestionsRequest = z.object({
  keyword: z.string().min(1, 'Keyword is required').meta({
    description: 'The keyword to get suggestions for',
    example: 'hey',
  }),
});

export const bilibiliPagesRequest = z.object({
  url: z.string().url('Must be a valid URL').meta({
    description: 'Bilibili video URL',
    example: 'https://www.bilibili.com/video/BV1234567890',
  }),
});

// -----------RESPONSE SCHEMAS-----------

export const searchSongResponse = z.object({
  page: z.number().meta({
    description: 'Current page number',
    example: 1,
  }),
  totalPage: z.number().meta({
    description: 'Total number of pages',
    example: 10,
  }),
  results: z.array(unparsedSongSchema).meta({
    description: 'Search results from external platforms',
  }),
  stored_songs: z.array(simpleSongSchema).meta({
    description: 'Matching songs already stored in database',
  }),
});

export const searchSuggestionsResponse = z.object({
  suggestions: z.array(z.string()).meta({
    description: 'Array of search suggestions',
    example: ['hey jude', 'hey ya', 'hey soul sister'],
  }),
});

export const bilibiliPagesResponse = z.object({
  data: z.array(bilibiliPageSchema).meta({
    description: 'Array of video pages',
  }),
});