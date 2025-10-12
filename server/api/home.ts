import { homeData } from '../data/home'

export default defineEventHandler(() => {
  return {
    data: homeData
  }
})

defineRouteMeta({
  openAPI: {
    tags: ["Home"],
    description: "Get home page data",
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/homeResponse' } } }
      },
    }
  }
}) 