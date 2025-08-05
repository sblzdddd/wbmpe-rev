export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const imageUrl = query.url as string

  if (!imageUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'URL parameter is required'
    })
  }

  // Validate that the URL is from allowed domains to prevent abuse
  const allowedDomains = [
    'i1.hdslb.com',
    'i0.hdslb.com',
    'i2.hdslb.com',
    'i3.hdslb.com',
    // Add more Bilibili CDN domains as needed
  ]

  let parsedUrl: URL
  try {
    const decodedUrl = decodeURIComponent(imageUrl)
    parsedUrl = new URL(decodedUrl)
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid URL format'
    })
  }

  if (!allowedDomains.includes(parsedUrl.hostname)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Domain not allowed'
    })
  }

  try {
    // Fetch the image with proper headers to bypass CORS
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.bilibili.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      }
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Failed to fetch image: ${response.statusText}`
      })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const imageBuffer = await response.arrayBuffer()

    // Set appropriate headers
    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Cache-Control', 'public, max-age=3600') // Cache for 1 hour
    setHeader(event, 'Access-Control-Allow-Origin', '*')
    
    return new Uint8Array(imageBuffer)
  } catch (error) {
    console.error('Image proxy error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to proxy image'
    })
  }
})