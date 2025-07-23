import Users from "../../models/Users"
import type { PlaylistMeta } from "../../../types/Playlist"

interface UserPlaylistsResponse {
  createdPlaylists: PlaylistMeta[]
  favorites: PlaylistMeta | null
  recent: PlaylistMeta | null
}

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id
  
    if (!userId) {
      throw createError({
        statusCode: 401,
        message: 'Not authenticated'
      })
    }
    
    const playlists = await Users.getUserPlaylists(userId)

    return playlists as UserPlaylistsResponse
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error 
    }
    
    console.error('Error:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error: ' + error
    })
  }
})

defineRouteMeta({
  openAPI: {
    $global: {
      components: {
        schemas: {
          UserPlaylistsResponse: {
            type: 'object',
            properties: {
              playlists: { 
                type: 'object',
                properties: {
                  createdPlaylists: { type: 'array', items: { $ref: '#/components/schemas/PlaylistMeta' } },
                  favorites: { $ref: '#/components/schemas/PlaylistMeta', nullable: true },
                  recent: { $ref: '#/components/schemas/PlaylistMeta', nullable: true }
                }
              }
            }
          }
        }
      }
    },

    tags: ["User"],
    description: "Get current user playlists",
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserPlaylistsResponse' } } }
      },
      '401': {
        description: 'Not authenticated',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      }
    }
  }
}) 