import { z } from 'zod';
import { objectIdSchemaCoerced } from './common';

// User Queue Schema
export const UserQueueUpdateRequest = z.object({
  songs: z.array(z.object({
    songId: objectIdSchemaCoerced('Song ID').meta({
      description: 'The ID of the song',
      override: {
        type: 'string',
      }
    }),
  })).optional(),
  currentIndex: z.number().min(0).optional(),
  currentTime: z.number().min(0).optional(),
});