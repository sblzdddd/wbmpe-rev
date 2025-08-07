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
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserPlaylistsResponse' } } }
      },
      '401': {
        description: 'Not authenticated',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      }
    }
  }
}) 