import { z } from 'zod';
import { objectIdSchemaCoerced } from './common';

// -----------LYRIC SCHEMAS-----------

export const lyricLineSchema = z.object({
  time: z.number().meta({
    description: 'Time offset in seconds',
    example: 12.34,
  }),
  text: z.string().meta({
    description: 'Lyric text',
    example: 'Hey Jude, don\'t make it bad',
  }),
});

export const lyricSchema = z.object({
  songId: z.string().meta({
    description: 'Song ID',
    example: '6863722013b04be86cb7a555',
  }),
  title: z.string().meta({
    description: 'Song title',
    example: 'Hey Jude',
  }),
  artist: z.string().meta({
    description: 'Artist name',
    example: 'The Beatles',
  }),
  lines: z.array(lyricLineSchema).meta({
    description: 'Lyric lines with timestamps',
  }),
  plainText: z.string().optional().meta({
    description: 'Plain text lyrics without timestamps',
    example: 'Hey Jude, don\'t make it bad...',
  }),
});

// -----------REQUEST SCHEMAS-----------

export const lyricIdParam = objectIdSchemaCoerced('Song ID').meta({
  description: 'Song ID to get lyrics for',
  example: '6863722013b04be86cb7a555',
  param: { in: 'path', name: 'id', required: true },
});

// -----------RESPONSE SCHEMAS-----------

export const lyricResponse = z.object({
  data: lyricSchema,
});
