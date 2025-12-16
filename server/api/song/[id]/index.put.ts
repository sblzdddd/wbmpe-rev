import { ObjectId } from 'mongodb';

const logger = BakaLogger.child({ service: 'SongUpdateAPI' });

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id;
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    const songId = getRouterParam(event, 'id');

    if (!songId || !isValidObjectIdString(songId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid song ID"
      });
    }

    logger.info(`SongUpdateAPI: Updating song ${songId}`);

    const song = await Songs.findById(songId);
    if (!song) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Song not found'
      });
    }

    if (song.addedBy && song.addedBy.toString() !== userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only edit songs you added'
      });
    }

    const result = await readValidatedBody(event, songUpdateRequest.safeParse);
    if (!result.success) {
      throw createError({statusCode: 400, statusMessage: result.error.message});
    }
    const { name, album, artists, duration } = result.data;

    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (album !== undefined) {
      if (album && !isValidObjectIdString(album)) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid album ID"
        });
      }
      if (album) {
        const albumExists = await Albums.findById(album);
        if (!albumExists) {
          throw createError({
            statusCode: 400,
            statusMessage: "Album not found"
          });
        }
      }
      updateData.album = album;
    }

    if (artists !== undefined) {
      for (const artistId of artists) {
        if (!isValidObjectIdString(artistId)) {
          throw createError({
            statusCode: 400,
            statusMessage: `Invalid artist ID: ${artistId}`
          });
        }
        const artistExists = await Artists.findById(artistId);
        if (!artistExists) {
          throw createError({
            statusCode: 400,
            statusMessage: `Artist not found: ${artistId}`
          });
        }
      }
      updateData.artists = artists;
    }

    if (duration !== undefined) {
      updateData.duration = duration;
    }

    const updatedSong = await Songs.findByIdAndUpdate(
      songId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedSong) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update song'
      });
    }

    if (album !== undefined || artists !== undefined) {
      if (album !== undefined && song.album.toString() !== album) {
        await Albums.findByIdAndUpdate(song.album, {
          $pull: { songs: { song: songId } }
        });
        if (album) {
          await Albums.addSongToAlbum(new ObjectId(album), new ObjectId(songId));
        }
      }

      if (artists !== undefined) {
        for (const oldArtistId of song.artists) {
          if (!artists.includes(oldArtistId.toString())) {
            await Artists.findByIdAndUpdate(oldArtistId, {
              $pull: { songs: { song: songId } }
            });
          }
        }
        for (const newArtistId of artists) {
          if (!song.artists.map(a => a.toString()).includes(newArtistId)) {
            await Artists.addSongToArtist(new ObjectId(newArtistId), new ObjectId(songId));
          }
        }
      }
    }

    logger.info(`SongUpdateAPI: Song ${songId} updated successfully`);

    return {
      success: true,
      data: {
        _id: updatedSong._id,
        name: updatedSong.name,
        album: updatedSong.album,
        artists: updatedSong.artists,
        duration: updatedSong.duration
      }
    };

  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
      throw error;
    }

    logger.error('SongUpdateAPI: Update failed', { error });
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

defineRouteMeta({
  openAPI: {
    tags: ["Song"],
    description: "Update a song's metadata (partial updates supported)",
    parameters: [
      { $ref: '#/components/parameters/songIdParam' }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/songUpdateRequest' }
        }
      }
    },
    responses: {
      '200': {
        description: 'Successful update',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/songUpdateResponse' } } }
      },
      '400': {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/validationErrorSchema' } } }
      },
      '401': {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
      '403': {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
      '404': {
        description: 'Song not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
    }
  }
});
