export const getImage = (src: string, { modifiers: _modifiers }: { modifiers: Record<string, unknown> }) => {
  
  const proxyUrl = `/api/proxy/image?url=${src.replace('/https', 'https')}`
  
  return {
    url: proxyUrl
  }
}
