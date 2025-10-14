import { Comments, IComment } from '../../models/Comments';
import type { ObjectId } from 'mongoose';

const logger = BakaLogger.child({'service': 'CommentAPI'})

export default defineEventHandler(async (event) => {
  try {
    const { id } = await parseRouteParams(event, objectIdSchemaCoerced('id'))
    const comments = await Comments.find({ entityId: id })
      .populate('user', '_id nickName avatarUrl')
      .lean();

    if (!comments) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Paint request not found'
      });
    }
    // Helper: recursively resolve replies and flatten them
    const resolveReplies = async (replyIds: (ObjectId | string)[]): Promise<IComment[]> => {
      if (!replyIds || replyIds.length === 0) return [];

      const replyComments = (await Comments.aggregate([
        { $unwind: '$comments' },
        { $match: { 'comments._id': { $in: replyIds } } },
        { $replaceRoot: { newRoot: '$comments' } },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 1,
            content: 1,
            createdAt: 1,
            parentComment: 1,
            replies: 1,
            user: {
              _id: '$user._id',
              name: '$user.name',
              email: '$user.email',
              picture: '$user.picture'
            }
          }
        }
      ])) as IComment[];

      const flattened: IComment[] = [];
      for (const reply of replyComments) {
        const nestedReplies = await resolveReplies(
          reply.replies as unknown as (ObjectId | string)[]
        );
        reply.replies = []; // clear nested replies
        flattened.push(reply, ...nestedReplies);
      }
      // Sort oldest → newest
      flattened.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      return flattened;
    };

    // Resolve replies for top-level comments
    if (comments && comments.length > 0) {
      for (const comment of comments as unknown as IComment[]) {
        if (comment.replies && comment.replies.length > 0) {
          // @ts-expect-error - TODO: fix the type changing of replies
          comment.replies = await resolveReplies(
            comment.replies as unknown as (ObjectId | string)[]
          );
        }
      }

      // Remove reply comments from root comments list
      const allReplyIds = comments.comments.flatMap((c) =>
        (c.replies as unknown as Comment[]).map((r) => r._id?.toString())
      );
      comments.comments = comments.comments.filter(
        (c) => !allReplyIds.includes(c._id.toString())
      );
    }

    return {
      success: true,
      data: comments.comments as unknown as typeof PaintRequestType
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
      throw error;
    }
    logger.error('CommentAPI: Server Error fetching comments', {error})
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
});

defineRouteMeta({
  openAPI: {
    tags: ["Comments"],
    description: "Fetch comments for a paint request",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: 'string' } }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CommentListResponse' } } }
      },
      '400': {
        description: 'Bad Request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/validationErrorSchema' } } }
      },
      '401': {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
      '500': {
        description: 'Internal Server Error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      }
    }
  }
})
