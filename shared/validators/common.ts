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
  .string()
  .refine((id) => isValidObjectIdString(id), {
    message: `${label} must be a valid ObjectId`,
  });

export const objectIdSchemaCoerced = (label = 'Object ID') => objectIdSchema(label)
  .transform((id) => new mongoose.Types.ObjectId(id));

// -----------FORM DATA VALIDATION-----------

export const formBooleanSchema = (label = 'Boolean') => z.string().refine((value) => value === 'true' || value === 'false', {
  message: `${label} must be a boolean string ('true' or 'false')`,
}).transform((value) => value === 'true');

// -----------FILE VALIDATION-----------

// Image buffer validation helper for multipart form data
export const validateImageFromBuffer = (buffer: Buffer, fileSizeLimit = 5 * 1024 * 1024): boolean => {
  return buffer.length > 0 && (
    buffer.subarray(0, 3).toString('hex') === 'ffd8ff' || // JPEG
    buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' || // PNG
    buffer.subarray(0, 6).toString() === 'GIF87a' || buffer.subarray(0, 6).toString() === 'GIF89a' || // GIF
    buffer.subarray(0, 4).toString() === 'RIFF' // WebP
  ) && buffer.length <= fileSizeLimit;
};

// Accept either a Buffer or a file object with a .buffer field
export const imageFileSchema = (label = 'Image File', fileSizeLimit = 5 * 1024 * 1024) => z
  .any()
  .refine((file) => {
    if (!file || !file.data) return true;
    if (Buffer.isBuffer(file.data)) return validateImageFromBuffer(file.data, fileSizeLimit);
    if (Buffer.isBuffer(file.buffer)) return validateImageFromBuffer(file.buffer, fileSizeLimit);
    return false;
  }, {
    message: `${label} must be a valid image file and less than ${fileSizeLimit / 1024 / 1024}MB`,
  })
  .transform((file) => {
    if (Buffer.isBuffer(file.data)) return file.data;
    else return file.buffer;
  });