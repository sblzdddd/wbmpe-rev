
export default defineEventHandler(() => {
  // TODO: Implement index page data
  return {
    status: 'ok',
    version: '1.0.0'
  }
})


defineRouteMeta({
  openAPI: {
    description: "Get server status",
    responses: {
      '200': {
        description: 'Successful response',
      }
    },
  }
})
