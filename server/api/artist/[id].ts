
import { ObjectId } from 'mongodb';
import Artists from '../../models/Artists';
import Albums from '../../models/Albums';
import UserSubscriptions from '../../models/UserSubscriptions';

defineRouteMeta({
  openAPI: {
    tags: ["Artist"],
    description: "Get an artist by ID",
    parameters: [
      { $ref: '#/components/parameters/artistIdParam' }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/artistResponse' } } }
      },
      '404': {
        description: 'Artist not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid ID format'
    })
  }

  const artistId = new ObjectId(id);

  // Fetch Artist
  const artist = await Artists.findById(artistId).lean();
  if (!artist) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Artist not found'
    })
  }
  
  const artistWithSongs = await Artists.findById(artistId)
    .populate({
      path: 'songs.song',
      select: '-__v -createdAt -updatedAt -lyrics',
      populate: [
        { path: 'album', select: 'name coverUrl' },
        { path: 'artists', select: 'name' }
      ]
    })
    .select('-__v')
    .lean();

  if (!artistWithSongs) {
     throw createError({
      statusCode: 404,
      statusMessage: 'Artist not found'
    })
  }

  const songs = artistWithSongs.songs
    .map((item: any) => item.song)
    .filter((song: any) => song != null);

  // Fetch Albums by this Artist
  const albums = await Albums.find({ artists: artistId })
    .select('name coverUrl platform createdAt')
    .sort({ createdAt: -1 })
    .lean();
    
  // Check if user is subscribed
  let isSubscribed = false;
  if (event.context.user?.id) {
    const userId = new ObjectId(event.context.user.id);
    const subscription = await UserSubscriptions.findOne({
      userId: userId,
      'subscribed_artists.artist': artistId
    });
    isSubscribed = !!subscription;
  }

  return {
    data: {
      ...artist,
      songs,
      albums,
      isSubscribed
    }
  }
})