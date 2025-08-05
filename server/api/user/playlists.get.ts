const logger = BakaLogger.child({service: 'UserPlaylistsAPI'})

interface UserPlaylistsResponse {
  createdPlaylists: PlaylistMeta[]
  favorites: PlaylistMeta | null
  recent: PlaylistMeta | null
}

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id
    
    const playlists = await Users.getUserPlaylists(userId)

    return playlists as UserPlaylistsResponse
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error 
    }
    
    logger.error('Error:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error: ' + error
    })
  }
})

defineRouteMeta({
  openAPI: {

    tags: ["User"],
    description: "Get current user playlists",
    responses: {
      '200': {
        description: 'Successful response',
      },
      '401': {
        description: 'Not authenticated',
      },
      '500': {
        description: 'Internal server error',
      }
    }
  }
}) 