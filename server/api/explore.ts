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
      }
    }
  }
}) 