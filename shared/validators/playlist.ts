import { z } from 'zod';
import { objectIdSchemaCoerced, imageFileSchema, formBooleanSchema } from './common';

export const playlistParamsSchema = z.object({
  id: objectIdSchemaCoerced("Playlist ID")
})

// Playlist Cover Schema for multipart form data
export const playlistCoverSchema = z.object({
  cover: z.any(), // MultipartFormData buffer
});

// Playlist Update Schema
export const playlistUpdateSchema = z.object({
  name: z.string().max(24).optional(),
  description: z.string().max(100).optional(),
  coverUrl: z.string().optional(),
  isPublic: z.boolean().optional(),
});


// Playlist Creation Schema for multipart form data
export const playlistCreateSchema = z.object({
  name: z.string().min(1, 'Playlist name is required').max(24, 'Playlist name must be 24 characters or less'),
  description: z.string().max(100, 'Description must be 100 characters or less').optional(),
  isPublic: formBooleanSchema('isPublic'),
  cover: imageFileSchema('Cover Image', 5 * 1024 * 1024).optional(),
});
