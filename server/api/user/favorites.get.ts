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
    
    const favoriteSongIds = await Users.getFavoriteSongIds(userId)

    return favoriteSongIds
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
          UserFavoritesResponse: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    },

    tags: ["User"],
    description: "Get current user favorite song ids",
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserFavoritesResponse' } } }
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