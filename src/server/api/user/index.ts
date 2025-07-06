
export default defineEventHandler(() => {
  // TODO: Implement index page data
})


defineRouteMeta({
  openAPI: {
    $global: {
      components: {
        schemas: {
          UserResponse: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  userName: { type: 'string' },
                  nickName: { type: 'string' },
                  avatarUrl: { type: 'string' }
                }
              }
            }
          },
          SimpleUser: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              userName: { type: 'string' },
              nickName: { type: 'string' },
              avatarUrl: { type: 'string' }
            }
          },
        }
      },
    }
  }
})
