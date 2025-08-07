import ParseTasks from '../../models/ParseTasks';
import UnparsedSongs from '../../models/UnparsedSongs';
import { sendTaskStatus } from './events.get';

const logger = BakaLogger.child({service: 'ParseTaskAPI'});

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event);
  
  const body = await readBody(event);
  const { songId } = body;
  
  if (!songId || !isValidObjectIdString(songId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid song ID"
    });
  }

  try {
    // Check if song exists in unparsed songs
    const unparsedSong = await UnparsedSongs.findById(songId);
    if (!unparsedSong) {
      throw createError({
        statusCode: 404,
        statusMessage: "Song not found"
      });
    }

    // Check if task already exists for this user and song
    const existingTask = await ParseTasks.findOne({
      userId: user._id,
      songId: songId,
      status: { $nin: ['completed', 'failed'] }
    });

    if (existingTask) {
      return {
        success: true,
        task: existingTask,
        message: "Task already exists"
      };
    }

    // Create new parsing task
    const task = await ParseTasks.createTask(user._id.toString(), {
      songId: songId,
      songName: unparsedSong.name,
      artistName: unparsedSong.artists.map((a: any) => a.name).join(', '),
      albumName: unparsedSong.album.name
    });

    logger.info(`Created parsing task ${task._id} for user ${user._id}, song ${songId}`);

    // Send SSE notification
    sendTaskStatus(
      user._id.toString(),
      task._id.toString(),
      'pending'
    );

    // Start parsing process asynchronously
    processParseTask(task._id.toString()).catch(error => {
      logger.error(`Failed to process task ${task._id}:`, error);
    });

    return {
      success: true,
      task: {
        _id: task._id,
        songName: task.songName,
        artistName: task.artistName,
        albumName: task.albumName,
        status: task.status,
        progress: task.progress,
        createdAt: task.createdAt
      }
    };

  } catch (error) {
    logger.error('Error creating parse task:', error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create parsing task"
    });
  }
});

// Async function to process the parsing task
async function processParseTask(taskId: string) {
  try {
    const task = await ParseTasks.findById(taskId);
    if (!task) {
      logger.error(`Task ${taskId} not found`);
      return;
    }

    logger.info(`Starting to process task ${taskId}`);

    // Update status to downloading
    await ParseTasks.updateStatus(taskId, 'downloading');
    sendTaskStatus(
      task.userId.toString(),
      taskId,
      'downloading'
    );

    // Import Streams model and start parsing
    const Streams = (await import('../../models/Streams')).default;
    await Streams.parseSong(task.songId.toString(), taskId, task.userId.toString());

    // Complete the task
    await ParseTasks.completeTask(taskId);
    sendTaskStatus(
      task.userId.toString(),
      taskId,
      'completed'
    );

    logger.info(`Successfully completed task ${taskId}`);

  } catch (error) {
    logger.error(`Error processing task ${taskId}:`, error);
    
    // Update task as failed
    await ParseTasks.updateStatus(
      taskId, 
      'failed', 
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    // Get task to find userId
    const failedTask = await ParseTasks.findById(taskId);
    if (failedTask) {
      sendTaskStatus(
        failedTask.userId.toString(),
        taskId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}

defineRouteMeta({
  openAPI: {
    tags: ["Tasks"],
    description: "Create a new song parsing task",
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              songId: { type: 'string', description: 'ID of the unparsed song to parse' }
            },
            required: ['songId']
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Task created successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                task: { 
                  type: 'object',
                  properties: {
                    _id: { type: 'string' },
                    songName: { type: 'string' },
                    artistName: { type: 'string' },
                    albumName: { type: 'string' },
                    status: { type: 'string' },
                    progress: { type: 'number' },
                    createdAt: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
      '400': {
        description: 'Bad Request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/validationErrorSchema' } } }
      },
      '404': {
        description: 'Song not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      }
    }
  }
});
