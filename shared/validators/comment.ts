import { z } from "zod";
import { simpleUserSchema } from "./user";
import { objectIdSchemaCoerced } from "./common";

export const ReplySchema = z.object({
  _id: z.string().optional().meta({
    description: 'Reply ID',
    example: '123',
  }),
  user: simpleUserSchema.meta({
    description: 'User who made the reply',
    example: simpleUserSchema,
  }),
  content: z.string().max(100).meta({
    description: 'Reply content',
    example: 'This is a reply',
  }),
  createdAt: z.string().meta({
    description: 'Reply creation date',
    example: '2021-01-01',
  }),
});

export const CommentSchema = z.object({
  _id: z.string().optional().meta({
    description: 'Comment ID',
    example: '123',
  }),
  user: simpleUserSchema.meta({
    description: 'User who made the comment',
    example: simpleUserSchema,
  }),
  content: z.string().max(100).meta({
    description: 'Comment content',
    example: 'This is a comment',
  }),
  createdAt: z.string().meta({
    description: 'Comment creation date',
    example: '2021-01-01',
  }),
  parentComment: z.string().optional().meta({
    description: 'Parent comment ID',
    example: '123',
  }),
  replies: z.array(ReplySchema).optional().meta({
    description: 'Replies to the comment',
    example: [ReplySchema],
  }),
});

export const CommentPostRequest = z.object({
  content: z.string().max(100).meta({
    description: 'Comment content',
    example: 'This is a comment',
  }),
  parentComment: objectIdSchemaCoerced('Parent comment ID').meta({
    description: 'The ID of the parent comment (optional)',
    example: '6863722013b04be86cb7a555',
  }).optional(),
});

export const CommentListResponse = z.object({
  success: z.boolean().meta({
    description: 'Success',
    example: true,
  }),
  data: z.array(CommentSchema).meta({
    description: 'Comments',
    example: [CommentSchema],
  }),
});

export const CommentDeleteResponse = z.object({ 
  success: z.boolean().meta({
    description: 'Success',
    example: true,
  }),
  message: z.string().meta({
    description: 'Message',
    example: 'Comment deleted successfully',
  }),
});

export const deleteCommentParams = z.object({
  commentId: objectIdSchemaCoerced('Comment ID').meta({
    description: 'Comment ID to delete',
    example: '6863722013b04be86cb7a555',
  }),
  id: objectIdSchemaCoerced('Paint Request ID').meta({
    description: 'Paint Request ID',
    example: '6863722013b04be86cb7a555',
  })
});
