import { z } from "zod";
import mongoose from "mongoose";

// -----------OBJECT ID VALIDATION-----------

export function isValidObjectIdString(idString: string): boolean {
  return mongoose.Types.ObjectId.isValid(idString);
}

export function isValidObjectId(id: mongoose.Types.ObjectId): boolean {
  return id instanceof mongoose.Types.ObjectId;
}

// Zod schema
export const objectIdSchema = (label = 'Object ID') => z
  .string().regex(/^[0-9a-fA-F]{24}$/, {
    message: `${label} must be a valid ObjectId`,
  })
  .refine((id) => isValidObjectIdString(id), {
    message: `${label} must be a valid ObjectId`,
  })
  .meta({
    description: 'A valid MongoDB ObjectId',
    example: '6863722013b04be86cb7a555',
  });

export const objectIdSchemaCoerced = (label = 'Object ID') => objectIdSchema(label)
  .transform((id) => new mongoose.Types.ObjectId(id));

// -----------FORM DATA VALIDATION-----------

export const emailSchema = z
  .email('Invalid email address').meta({
    description: 'The email address of the user',
    example: 'user@example.com',
    id: 'emailSchema'
  });

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long').meta({
    description: 'The password of the user',
    example: 'password@123456',
    id: 'passwordSchema'
  })

export const formBooleanSchema = z
  .string().regex(/^(true|false)$/, {
    message: `must be a boolean string ('true' or 'false')`,
  })
  .meta({
    description: 'A valid boolean string',
    example: 'true',
    id: 'formBooleanSchema',
    override: {
      format: 'boolean',
    }
  });

export const formBooleanSchemaCoerced = formBooleanSchema
  .transform((value) => value === 'true');

// -----------FILE VALIDATION-----------

// Image buffer validation helper for multipart form data
export const validateImageFromBuffer = (buffer: Buffer, sizeLimit = 5 * 1024 * 1024): boolean => {
  return buffer.length > 0 && (
    buffer.subarray(0, 3).toString('hex') === 'ffd8ff' || // JPEG
    buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' || // PNG
    buffer.subarray(0, 6).toString() === 'GIF87a' || buffer.subarray(0, 6).toString() === 'GIF89a' || // GIF
    buffer.subarray(0, 4).toString() === 'RIFF' // WebP
  ) && buffer.length <= sizeLimit;
};

// Accept either a Buffer or a file object with a .buffer field
export const imageFileSchema = (label = 'Image File', sizeLimit = 5 * 1024 * 1024) => z
  .any()
  .refine((file) => {
    if (!file || !file.data) return true;
    if (Buffer.isBuffer(file.data)) return validateImageFromBuffer(file.data, sizeLimit);
    if (Buffer.isBuffer(file.buffer)) return validateImageFromBuffer(file.buffer, sizeLimit);
    return false;
  }, {
    message: `${label} must be a valid image file and less than ${sizeLimit / 1024 / 1024}MB`,
  }).meta({
    description: 'A valid image file',
    example: '[no example]',
    override: {
      type: 'string',
      format: 'binary',
    }
  });

// -----------PAGINATION-----------

export const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).meta({
    description: 'Page number',
    example: 1,
  }),
  limit: z.coerce.number().min(1).max(100).default(100).meta({
    description: 'Number of items per page',
    example: 100,
  }),
});

export const paginationResponseSchema = z.object({
  page: z.number().meta({
    description: 'Current page number',
    example: 1,
  }),
  totalPage: z.number().meta({
    description: 'Total number of pages',
    example: 5,
  }),
  limit: z.number().meta({
    description: 'Number of items per page',
    example: 100,
  }),
  total: z.number().meta({
    description: 'Total number of items',
    example: 500,
  }),
});

// -----------SUCCESS RESPONSES-----------

export const successResponseSchema = z.object({
  success: z.boolean().meta({
    description: 'Whether the operation was successful',
    example: true,
  }),
  message: z.string().optional().meta({
    description: 'Success message',
    example: 'Operation completed successfully',
  }),
});

export const apiIndexResponse = z.object({
  status: z.string().meta({
    description: 'API status',
    example: 'ok',
  }),
  version: z.string().meta({
    description: 'API version',
    example: '1.0.0',
  }),
});

// -----------ERRORS-----------

export const generalErrorSchema = z.object({
  error: z.boolean().meta({
    description: 'Whether the error occurred',
    example: false,
  }),
  url: z.url().meta({
    description: 'The URL of the request',
    example: 'https://example.com/error',
  }),
  statusCode: z.number().meta({
    description: 'The HTTP status code',
    example: 400,
  }),
  statusMessage: z.string().meta({
    description: 'The status message',
    example: 'Bad Request',
  }),
  message: z.string().meta({
    description: 'The error message',
    example: 'Invalid request',
  }),
  stack: z.string().optional().meta({
    description: 'The stack trace (will be hidden in production)',
    example: 'Error: Invalid request\n    at Object.onRequest (/path/to/file.js:123:45)\n    at processTicksAndRejections (node:internal/process/task_queues:96:5)',
  }),
}).meta({
  description: 'A general error response',
});

export const validationErrorSchema = z.object({
  error: z.boolean().meta({
    description: 'Whether the error occurred',
    example: false,
  }),
  url: z.url().meta({
    description: 'The URL of the request',
    example: 'https://example.com/error',
  }),
  statusCode: z.number().meta({
    description: 'The HTTP status code',
    example: 400,
  }),
  statusMessage: z.string().meta({
    description: 'The status message',
    example: 'Bad Request',
  }),
  message: z.string().optional().meta({
    description: 'The error message',
    example: 'Invalid request',
  }),
  data: z.array(z.object({
    origin: z.string().meta({
      description: 'The origin of the error',
      example: 'string',
    }),
    code: z.string().meta({
      description: 'The error code',
      example: 'invalid_format',
    }),
    format: z.string().optional().meta({
      description: 'The expected format',
      example: 'regex',
    }),
    pattern: z.string().optional().meta({
      description: 'The expected pattern (regex only)',
      example: '/^[0-9a-fA-F]{24}$/',
    }),
    path: z.array(z.string()).meta({
      description: 'The path of the error',
      example: ['path', 'to', 'error', 'field'],
    }),
    message: z.string().meta({
      description: 'The error message',
      example: 'Invalid request',
    }),
  }).meta({
    description: 'The validation issue items',
  })),
  stack: z.string().optional().meta({
    description: 'The stack trace (will be hidden in production)',
    example: 'Error: Invalid request\n    at Object.onRequest (/path/to/file.js:123:45)\n    at processTicksAndRejections (node:internal/process/task_queues:96:5)',
  }),
}).meta({
  description: 'A validation error response'
});

export const errorSchema = generalErrorSchema;

