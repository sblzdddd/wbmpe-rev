import { exploreData } from '../data/explore'

export default defineEventHandler(() => {
  return {
    data: exploreData
  }
})

defineRouteMeta({
  openAPI: {
    $global: {
      components: {
        schemas: {
          RecomItem: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              artist: { type: 'string' },
              image: { type: 'string' },
              link: { type: 'string' }
            }
          },
          Recom: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              items: { type: 'array', items: { $ref: '#/components/schemas/RecomItem' } }
            }
          },
          ExploreData: {
            type: 'object',
            properties: {
              categories: { type: 'array', items: { type: 'string' } },
              items: { type: 'array', items: { $ref: '#/components/schemas/Recom' } }
            }
          },
          ExploreResponse: {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/ExploreData' }
            }
          }
        }
      }
    },
    tags: ["Explore"],
    description: "Get explore page data",
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ExploreResponse' } } }
      }
    }
  }
}) 