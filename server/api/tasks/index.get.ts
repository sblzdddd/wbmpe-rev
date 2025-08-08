const logger = BakaLogger.child({service: 'TasksAPI'});

export default defineEventHandler(async (event) => {
  const user = await event.context.user?.id;
  
  const query = getQuery(event);
  const limit = Number(query.limit) || 10;
  const status = query.status as string;

  try {
    let tasks;
    
    if (status) {
      // Filter by status if provided
      tasks = await ParseTasks.find({ 
        userId: user,
        status: status
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    } else {
      // Get all tasks for user
      tasks = await ParseTasks.getUserTasks(user, limit);
    }

    return {
      success: true,
      tasks: tasks.map(task => ({
        _id: task._id,
        songId: task.songId,
        songName: task.songName,
        artistName: task.artistName,
        albumName: task.albumName,
        status: task.status,
        progress: task.progress,
        progressMessage: task.progressMessage,
        errorMessage: task.errorMessage,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt
      }))
    };

  } catch (error) {
    logger.error('Error fetching user tasks:', error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch tasks"
    });
  }
});

defineRouteMeta({
  openAPI: {
    tags: ["Tasks"],
    description: "Get user's parsing tasks",
    parameters: [
      {
        name: 'limit',
        in: 'query',
        description: 'Maximum number of tasks to return',
        required: false,
        schema: { type: 'number', default: 10 }
      },
      {
        name: 'status',
        in: 'query',
        description: 'Filter tasks by status',
        required: false,
        schema: { 
          type: 'string', 
          enum: ['pending', 'downloading', 'processing', 'completed', 'failed']
        }
      }
    ],
    responses: {
      '200': {
        description: 'Tasks retrieved successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                tasks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      songId: { type: 'string' },
                      songName: { type: 'string' },
                      artistName: { type: 'string' },
                      albumName: { type: 'string' },
                      status: { type: 'string' },
                      progress: { type: 'number' },
                      progressMessage: { type: 'string' },
                      errorMessage: { type: 'string' },
                      createdAt: { type: 'string' },
                      startedAt: { type: 'string' },
                      completedAt: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      }
    }
  }
});
