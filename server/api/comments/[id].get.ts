import { Comments, IComment, ICommentSchema } from '../../models/Comments';
import type { Comments as CommentType } from '../../models/Comments';
import type { ObjectId } from 'mongoose';

const logger = BakaLogger.child({'service': 'CommentAPI'})

export default defineEventHandler(async (event) => {
  try {
    const { id } = await parseRouteParams(event, PlaylistRequestParamsInternal)
    const commentObj = await Comments.findOne({ entityId: id })
      .populate('comments.user', '_id nickName userName avatarUrl')
      .lean() as unknown as ICommentSchema;

    if (!commentObj) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Comment not found'
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
              userName: '$user.userName',
              nickName: '$user.nickName',
              avatarUrl: '$user.avatarUrl'
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
    if (commentObj.comments && commentObj.comments.length > 0) {
      for (const comment of commentObj.comments as unknown as IComment[]) {
        if (comment.replies && comment.replies.length > 0) {
          // @ts-expect-error - TODO: fix the type changing of replies
          comment.replies = await resolveReplies(
            comment.replies as unknown as (ObjectId | string)[]
          );
        }
      }

      // Remove reply comments from root comments list
      const allReplyIds = commentObj.comments.flatMap((c) =>
        (c.replies || []).map((r) => r._id?.toString())
      );
      commentObj.comments = commentObj.comments.filter(
        (c) => !allReplyIds.includes(c._id.toString())
      );
    }

    return {
      success: true,
      data: commentObj.comments as unknown as typeof CommentType
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
