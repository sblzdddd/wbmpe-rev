import { z } from 'zod';
import { objectIdSchemaCoerced } from './common';

// User Queue Schema
export const userQueueSchema = z.object({
  songs: z.array(z.object({
    songId: objectIdSchemaCoerced('Song ID'),
  })).optional(),
  currentIndex: z.number().min(0).optional(),
  currentTime: z.number().min(0).optional(),
});