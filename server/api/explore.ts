import { exploreData } from '../data/explore'

export default defineEventHandler(() => {
  return {
    data: exploreData
  }
})

defineRouteMeta({
  openAPI: {
    tags: ["Explore"],
    description: "Get explore page data",
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/exploreResponse' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      }
    }
  }
}) 