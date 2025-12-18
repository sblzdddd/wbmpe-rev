import type { ObjectId } from 'mongodb';
import { Comments } from '../../../models/Comments';
import { deleteCommentParams } from '~~/shared/validators/comment';

const logger = BakaLogger.child({'service': 'CommentAPI'})

export default defineEventHandler(async (event) => {
  try {
    const { commentId, id } = await parseRouteParams(event, deleteCommentParams)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Request ID is required'
      });
    }

    if (!commentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Comment ID is required'
      });
    }

    // Get the current user from the session
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      });
    }

    const comment = await Comments.findOne({ entityId: id });
    if (!comment) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Comment not found'
      });
    }
    

    // Find the comment to delete
    const commentIndex = comment.comments.findIndex(
      comment => comment._id.toString() === commentId.toString()
    );

    if (commentIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Comment not found'
      });
    }

    const commentItem = comment.comments[commentIndex];

    const replies = commentItem.replies;
    
    function deleteReplies(replies: ObjectId[] | undefined) {
      if (!replies || !comment) return;
      for (const reply of replies) {
        const replyIndex = comment.comments.findIndex(
          comment => comment._id.toString() === reply.toString()
        );
        if(replyIndex === -1) {
          continue;
        }
        const replyComment = comment.comments[replyIndex];
        if (replyComment.replies) {
          deleteReplies(replyComment.replies);
        }
        if (replyIndex !== -1) {
          comment.comments.splice(replyIndex, 1);
        }
      }
    }
    
    if(replies && replies.length > 0) {
      deleteReplies(replies);
    }

    // Check if user owns the comment
    if (commentItem.user.toString() !== user.id.toString()) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only delete your own comments'
      });
    }

    // Remove the comment
    comment.comments.splice(commentIndex, 1);

    await comment.save();

    return {
      success: true,
      message: 'Comment deleted successfully'
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
      throw error;
    }
    logger.error('CommentAPI: Server Error deleting comment', {error})
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
    description: "Delete a comment",
    parameters: [
      { in: "path", name: "commentId", required: true, schema: { type: 'string' } },
      { in: "path", name: "id", required: true, schema: { type: 'string' } }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CommentDeleteResponse' } } }
      },
      '400': {
        description: 'Bad Request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/validationErrorSchema' } } }
      },
      '401': {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
      '403': {
        description: 'Forbidden (Unprivileged deletion)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
      '404': {
        description: 'Comment Not Found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
      '500': {
        description: 'Internal Server Error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      }
    }
  }
})
