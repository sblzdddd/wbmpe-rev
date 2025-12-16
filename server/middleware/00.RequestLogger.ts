const requestLogger = BakaLogger.child({service: 'API'})

requestLogger.log('success', 'Request logger initialized');

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  const url = getRequestURL(event)
  const method = event.node.req.method || 'Unknown'
  const headers = getHeaders(event)
  const query = getQuery(event)
  const userAgent = headers['user-agent'] || 'Unknown'
  
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'Unknown'
  
  const referer = headers.referer || 'Direct'
  
  let body = null
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      body = await readBody(event)
    } catch {
      body = 'Unable to read body'
    }
  }

  const requestInfo = {
    timestamp: new Date().toISOString(),
    method,
    pathname: url.pathname,
    fullUrl: url.href,
    query: Object.keys(query).length > 0 ? query : null,
    headers: {
      'user-agent': userAgent,
      'accept': headers.accept,
      'accept-language': headers['accept-language'],
      'accept-encoding': headers['accept-encoding'],
      'content-type': headers['content-type'],
      'content-length': headers['content-length'],
      'authorization': headers.authorization ? 'Present' : 'None',
      'cookie': headers.cookie ? 'Present' : 'None',
      'origin': headers.origin,
      'referer': referer,
      'host': headers.host,
      'connection': headers.connection,
      'cache-control': headers['cache-control'],
      'sec-fetch-dest': headers['sec-fetch-dest'],
      'sec-fetch-mode': headers['sec-fetch-mode'],
      'sec-fetch-site': headers['sec-fetch-site'],
      'x-forwarded-for': headers['x-forwarded-for'],
      'x-real-ip': headers['x-real-ip'],
      'x-forwarded-proto': headers['x-forwarded-proto'],
      'x-forwarded-host': headers['x-forwarded-host'],
    },
    client: {
      ip,
      userAgent,
    },
    body: body,
    timing: {
      startTime: startTime,
    }
  }

  requestLogger.log('verbose', JSON.stringify(requestInfo, null, 2))

  event.node.res.on('finish', () => {
    const endTime = Date.now()
    const duration = endTime - startTime
    const statusCode = event.node.res.statusCode
    
    const responseInfo = {
      timestamp: new Date().toISOString(),
      method,
      pathname: url.pathname,
      statusCode,
      duration: `${duration}ms`,
      contentLength: event.node.res.getHeader('content-length') || 'Unknown'
    }
    
    requestLogger.log('verbose', JSON.stringify(responseInfo, null, 2))
    
    const params = Object.keys(query).length > 0 ? JSON.stringify(query) : ''
    const statusColor = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : statusCode >= 300 ? 'info' : 'success'
    const consoleMessage = `${levelColors.verbose}${ip} ${levelColors.silly}${method} ${levelColors.lightBlue}${url.pathname} ${levelColors[statusColor]}${statusCode} ${levelColors.orange}${duration}ms${levelColors.gray}${params ? ` ${params}` : ''}${resetColor}`
    
    requestLogger.info(consoleMessage)
  })
})