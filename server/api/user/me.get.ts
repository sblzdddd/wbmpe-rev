import type { UserInfoResponse } from "../../../types/User/User"
import Users from "../../models/Users"

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id
  
    if (!userId) {
      throw createError({
        statusCode: 401,
        message: 'Not authenticated'
      })
    }
    
    const user = await Users.getUserInfo(userId)

    return { user } as UserInfoResponse
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
          UserInfoResponse: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/UserInfo' }
            }
          },
          UserInfo: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              userName: { type: 'string' },
              nickName: { type: 'string' },
              avatarUrl: { type: 'string' },
              bio: { type: 'string', nullable: true },
              createdPlaylists: { type: 'array', items: { $ref: '#/components/schemas/PlaylistMeta' } },
              favorites: { $ref: '#/components/schemas/PlaylistMeta', nullable: true },
              recent: { $ref: '#/components/schemas/PlaylistMeta', nullable: true }
            }
          },
          PlaylistMeta: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              coverUrl: { type: 'string', nullable: true },
              name: { type: 'string' }
            }
          }
        }
      }
    },

    tags: ["User"],
    description: "Get current user information",
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserInfoResponse' } } }
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