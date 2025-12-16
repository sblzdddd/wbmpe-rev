import { randomUUID } from "crypto";

const logger = BakaLogger.child({ service: 'ImageUploadAPI' });

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id;
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    logger.info('ImageUploadAPI: Processing image upload', { userId });

    // Parse multipart form data
    const form = await readMultipartFormData(event);
    if (!form) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No form data provided'
      });
    }

    // Find image file in form data
    const imageFile = form.find(item => item.name === 'image');
    if (!imageFile || !imageFile.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No image file provided'
      });
    }

    const folderItem = form.find(item => item.name === 'folder');
    const folder = folderItem?.data?.toString() || 'images';

    const filename = imageFile.filename || 'image.jpg';
    const buffer = imageFile.data;

    // Basic validation
    if (buffer.length > 5 * 1024 * 1024) { // 5MB limit
      throw createError({
        statusCode: 400,
        statusMessage: 'File size too large. Maximum size is 5MB.'
      });
    }

    // Upload to OSS
    const fileName = `${randomUUID()}.${filename.split('.').pop()?.toLowerCase() || 'jpg'}`;
    const result = await mediaUploadService.uploadMediaFromBuffer(buffer, `${folder}/${fileName}`);

    logger.info('ImageUploadAPI: Image uploaded successfully', { 
      userId,
      filename: result.name,
      path: result.path
    });

    return {
      success: true,
      data: result
    };

  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
      throw error;
    }

    logger.error('ImageUploadAPI: Upload failed', { error });
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

defineRouteMeta({
  openAPI: {
    tags: ["Upload"],
    description: "Upload an image file",
    requestBody: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              image: {
                type: 'string',
                format: 'binary',
                description: 'Image file to upload'
              },
              folder: {
                type: 'string',
                description: 'Folder to upload to (optional, defaults to "images")'
              }
            },
            required: ['image']
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Successful upload',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/imageUploadResponse' } } }
      },
      '400': {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/validationErrorSchema' } } }
      },
      '401': {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
    }
  }
}); 