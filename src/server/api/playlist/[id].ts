import type { Playlist } from '~/types/playlist'
import { findFullPlaylistData } from "~/server/models/Playlists";
import mongoose from 'mongoose'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const playlistId = id as string
  console.log(playlistId)

  // Get pagination parameters from query
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 100

  // Ensure MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    console.log('Waiting for MongoDB connection...')
    await mongoose.connection.asPromise()
  }

  const playlist = await findFullPlaylistData(playlistId, page, limit)
  
  if (!playlistId || !playlist) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Playlist not found'
    })
  }
  
  return {
    data: playlist as unknown as Playlist
  }
}) 