import { homeData } from '../data/home'

export default defineEventHandler(() => {
  return {
    data: homeData
  }
})

defineRouteMeta({
  openAPI: {
    $global: {
      components: {
        schemas: {
          Banner: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              image: { type: 'string' },
              link: { type: 'string' },
              external: { type: 'boolean' }
            }
          },
          CardRecom: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              image: { type: 'string' },
              link: { type: 'string' }
            }
          },
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
          HomeData: {
            type: 'object',
            properties: {
              banner: { type: 'array', items: { $ref: '#/components/schemas/Banner' } },
              card_recom: { type: 'array', items: { $ref: '#/components/schemas/CardRecom' } },
              recom: { type: 'array', items: { $ref: '#/components/schemas/Recom' } }
            }
          },
          HomeResponse: {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/HomeData' }
            }
          }
        }
      }
    },
    tags: ["Home"],
    description: "Get home page data",
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/HomeResponse' } } }
      }
    }
  }
}) 