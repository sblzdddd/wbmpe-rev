import { z } from 'zod';
import { imageFileSchemaCoerced } from './common';

// -----------UPLOAD SCHEMAS-----------

export const uploadResultSchema = z.object({
  url: z.string().meta({
    description: 'Uploaded file URL',
    example: 'https://example.com/uploads/image.jpg',
  }),
  path: z.string().meta({
    description: 'File path on server',
    example: '/uploads/images/image.jpg',
  }),
  name: z.string().meta({
    description: 'File name',
    example: 'image.jpg',
  }),
});

// -----------REQUEST SCHEMAS-----------

export const imageUploadRequest = z.object({
  image: imageFileSchemaCoerced("Image File", 5 * 1024 * 1024).meta({
    description: 'Image file to upload',
    example: '[no example]',
  }),
  folder: z.string().optional().meta({
    description: 'Folder to upload to (optional, defaults to "images")',
    example: 'avatars',
  }),
});

// -----------RESPONSE SCHEMAS-----------

export const imageUploadResponse = z.object({
  success: z.boolean().meta({
    description: 'Whether the upload was successful',
    example: true,
  }),
  data: uploadResultSchema,
});
