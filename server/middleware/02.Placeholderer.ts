import { defineEventHandler } from 'h3'

const PLACEHOLDER_BASE = 'https://picsum.photos'
const PLACEHOLDER_SIZE = 500

function hashString(input: string): string {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    // hash * 33 + charCode
    hash = ((hash << 5) + hash) + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function computeSeedFromObject(obj: Record<string, unknown>): string {
  const candidates = [
    obj._id,
    obj.id,
    obj.externalId,
    obj.name,
  ].filter((v): v is string => typeof v === 'string' && v.length > 0)

  const seedSrc = candidates[0] ?? JSON.stringify(Object.keys(obj).sort().reduce((acc, k) => {
    acc[k] = obj[k as keyof typeof obj]
    return acc
  }, {} as Record<string, unknown>))

  return encodeURIComponent(hashString(String(seedSrc)))
}

function placeholderUrlFor(obj: Record<string, unknown>): string {
  const seed = computeSeedFromObject(obj)
  return `${PLACEHOLDER_BASE}/seed/${seed}/${PLACEHOLDER_SIZE}/${PLACEHOLDER_SIZE}`
}

function extractNames(obj: Record<string, unknown>): {
  songName?: string
  albumName?: string
  artistNames?: string[]
} {
  let songName: string | undefined
  let albumName: string | undefined
  let artistNames: string[] | undefined

  const maybeName = typeof obj.name === 'string' ? obj.name : undefined

  if (obj && typeof obj.album === 'object' && obj.album) {
    const alb = obj.album as Record<string, unknown>
    albumName = typeof alb.name === 'string' ? alb.name : undefined
    songName = maybeName
  } else {
    albumName = maybeName
  }

  if (Array.isArray(obj.artists)) {
    artistNames = (obj.artists as unknown[]).map((a) => {
      if (a && typeof a === 'object' && typeof (a as Record<string, unknown>).name === 'string') {
        return (a as Record<string, unknown>).name as string
      }
      return typeof a === 'string' ? a : ''
    }).filter(Boolean)
  }

  return { songName, albumName, artistNames }
}

function placeholderTextFor(obj: Record<string, unknown>): string {
  const { songName, albumName, artistNames } = extractNames(obj)
  const seedSrc = [songName ?? '', albumName ?? '', (artistNames ?? []).join(',')].join('|')
  const base = seedSrc.trim().length > 0 ? seedSrc : JSON.stringify(obj)
  const h = hashString(base)
  return h.slice(0, 8).toUpperCase()
}

function replaceCoverUrlsDeep(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(replaceCoverUrlsDeep)
  }
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(obj)) {
      const value = obj[key]
      if (typeof key === 'string' && (key.toLowerCase() === 'coverurl' || key.toLowerCase() === 'avatarurl') && typeof value === 'string' && value.length > 0) {
        out[key] = placeholderUrlFor(obj)
        if (typeof obj['name'] === 'string') {
          out['name'] = placeholderTextFor(obj)
        }
      } else {
        out[key] = replaceCoverUrlsDeep(value)
      }
    }

    // Additionally override album and artists names deterministically
    const albumVal = out['album']
    if (albumVal && typeof albumVal === 'object') {
      const albObj = albumVal as Record<string, unknown>
      if (typeof albObj['name'] === 'string') {
        albObj['name'] = placeholderTextFor(albObj)
      }
    }

    const artistsVal = out['artists']
    if (Array.isArray(artistsVal)) {
      out['artists'] = artistsVal.map((a) => {
        if (a && typeof a === 'object') {
          const ao = a as Record<string, unknown>
          if (typeof ao['name'] === 'string') {
            ao['name'] = placeholderTextFor(ao)
          }
        }
        return a as unknown
      }) as unknown as typeof artistsVal
    }

    const songVal = out['song']
    if (songVal && typeof songVal === 'object') {
      const so = songVal as Record<string, unknown>
      if (typeof so['name'] === 'string') {
        so['name'] = placeholderTextFor(so)
      }
    }

    const songsVal = out['songs']
    if (Array.isArray(songsVal)) {
      out['songs'] = songsVal.map((s) => {
        if (s && typeof s === 'object') {
          const so = s as Record<string, unknown>
          if (typeof so['name'] === 'string') {
            so['name'] = placeholderTextFor(so)
          }
        }
        return s as unknown
      }) as unknown as typeof songsVal
    }
    const storedSongsVal = out['stored_songs']
    if (Array.isArray(storedSongsVal)) {
      out['stored_songs'] = storedSongsVal.map((s) => {
        if (s && typeof s === 'object') {
          const so = s as Record<string, unknown>
          if (typeof so['name'] === 'string') {
            so['name'] = placeholderTextFor(so)
          }
        }
        return s as unknown
      }) as unknown as typeof songsVal
    }
    const dataVal = out['data']
    if (Array.isArray(dataVal)) {
      out['data'] = dataVal.map((s) => {
        if (s && typeof s === 'object') {
          const so = s as Record<string, unknown>
          if (typeof so['name'] === 'string') {
            so['name'] = placeholderTextFor(so)
          }
        }
        return s as unknown
      }) as unknown as typeof songsVal
    }
    return out
  }
  return data
}

export default defineEventHandler((event) => {
  const res = event.node.res

  const originalWrite = res.write.bind(res)
  const originalEnd = res.end.bind(res)

  const chunks: Buffer[] = []

  ;(res.write as any) = function (chunk: any, encoding?: BufferEncoding, cb?: (error?: Error | null) => void) {
    try {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding))
      }
      if (typeof cb === 'function') cb()
      return true
    } catch (e) {
      return originalWrite(chunk, encoding as any, cb as any)
    }
  }

  ;(res.end as any) = function (chunk?: any, encoding?: BufferEncoding, cb?: () => void) {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding))
    }

    const bodyBuffer = chunks.length ? Buffer.concat(chunks) : undefined
    const contentType = (res.getHeader('content-type') || res.getHeader('Content-Type')) as string | number | string[] | undefined

    if (bodyBuffer && contentType && String(contentType).includes('application/json')) {
      try {
        const text = bodyBuffer.toString('utf8')
        const json = JSON.parse(text)
        const transformed = replaceCoverUrlsDeep(json)
        const payload = Buffer.from(JSON.stringify(transformed))
        res.setHeader('content-length', Buffer.byteLength(payload))
        return originalEnd(payload, 'utf8', cb as any)
      } catch {
        // If we fail to parse/transform, fallback to original body
      }
    }

    return originalEnd(bodyBuffer, encoding as any, cb as any)
  }
})
