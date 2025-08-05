export const getImage = (src: string, { modifiers = {} }: { modifiers: Record<string, unknown> }) => {

  console.log('modifiers', modifiers)
  // Extract width and height from modifiers
  const width = modifiers.width as number | undefined
  const height = modifiers.height as number | undefined

  if(modifiers.resize) {
    if((modifiers.resize as Record<string, unknown>).s) {
      const s = (modifiers.resize as Record<string, unknown>).s as number
      return {
        url: src + `?param=${s}y${s}`
      }
    }
  }
  
  // Determine size - use width if available, otherwise height, otherwise default to 300
  const size = width || height || 300
  
  // Add the Netease image parameters
  const params = `?param=${size}y${size}`
  
  return {
    url: src + params
  }
}
