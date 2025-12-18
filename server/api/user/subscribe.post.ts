
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import UserSubscriptions from '../../models/UserSubscriptions';

const subscribeSchema = z.object({
  type: z.enum(['artist', 'album', 'playlist']),
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  set: z.boolean()
});

defineRouteMeta({
  openAPI: {
    tags: ["User"],
    description: "Subscribe/Unsubscribe to an entity",
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['artist', 'album', 'playlist'] },
              id: { type: 'string' },
              set: { type: 'boolean' }
            },
            required: ['type', 'id', 'set']
          }
        }
      }
    },
    responses: {
      '200': { description: 'Success' },
      '401': { description: 'Unauthorized' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || !user.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody(event);
  const result = subscribeSchema.safeParse(body);
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error?.message || 'Validation error' });
  }

  const { type, id, set } = result.data;
  const userId = new ObjectId(user.id);
  const entityId = new ObjectId(id);

  try {
    const subscription = await UserSubscriptions.findOne({ userId });

    if (!subscription) {
      if (set) {
        // Create new subscription doc
        const newSub = {
          userId,
          subscribed_playlists: type === 'playlist' ? [{ playlist: entityId }] : [],
          subscribed_artists: type === 'artist' ? [{ artist: entityId }] : [],
          subscribed_albums: type === 'album' ? [{ album: entityId }] : [],
          subscribed_users: []
        };
        await UserSubscriptions.create(newSub);
      }
      return { success: true };
    }

    if (set) {
      // Check validation
      let exists = false;
      if (type === 'artist') {
        exists = subscription.subscribed_artists.some((item: any) => item.artist.equals(entityId));
        if (!exists) {
            await UserSubscriptions.updateOne({ userId }, { $push: { subscribed_artists: { artist: entityId } } });
        }
      } else if (type === 'album') {
        exists = subscription.subscribed_albums.some((item: any) => item.album.equals(entityId));
        if (!exists) {
            await UserSubscriptions.updateOne({ userId }, { $push: { subscribed_albums: { album: entityId } } });
        }
      } else {
        exists = subscription.subscribed_playlists.some((item: any) => item.playlist.equals(entityId));
        if (!exists) {
            await UserSubscriptions.updateOne({ userId }, { $push: { subscribed_playlists: { playlist: entityId } } });
        }
      }
    } else {
        // Remove
        if (type === 'artist') {
            await UserSubscriptions.updateOne({ userId }, { $pull: { subscribed_artists: { artist: entityId } } });
        } else if (type === 'album') {
            await UserSubscriptions.updateOne({ userId }, { $pull: { subscribed_albums: { album: entityId } } });
        } else {
            await UserSubscriptions.updateOne({ userId }, { $pull: { subscribed_playlists: { playlist: entityId } } });
        }
    }

    return { success: true };
  } catch (e) {
    console.error(e);
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
  }
});
