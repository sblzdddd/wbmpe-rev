import { createLookupMaps, processAlbum, processArtist } from '../search_util'
import type { MikufansSearchResponse } from './Schemas'
const logger = BakaLogger.child({service: 'MikufansSearch'})

// Global cookie storage for bilibili requests
let bilibiliCookies: string = ''

async function ensureBilibiliCookies(): Promise<string> {
  // Check if we already have the required cookies
  if (bilibiliCookies && bilibiliCookies.includes('buvid3') && bilibiliCookies.includes('b_nut')) {
    return bilibiliCookies
  }

  try {
    // Fetch bilibili.com to get initial cookies
    const response = await fetch('https://bilibili.com', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Cache-Control': 'no-cache',
        'Host': 'bilibili.com',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://www.bilibili.com/'
      }
    })

    // Extract cookies from Set-Cookie headers
    const setCookieHeaders = response.headers.getSetCookie?.() || []
    const cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ')
    
    // Store the cookies for future use
    if (cookies) {
      bilibiliCookies = cookies
    }
    
    return bilibiliCookies
  } catch (error) {
    logger.warn('Failed to fetch bilibili cookies:', error)
    return ''
  }
}

export async function searchSongBilibili(_keyword: string, page: number): Promise<SearchReturnType> {
  try {
    // Ensure we have the required cookies before making the API request
    const cookies = await ensureBilibiliCookies()
    
    const url = `https://api.bilibili.com/x/web-interface/search/type?page=${page}&page_size=6&keyword=${_keyword}&search_type=video&highlight=0`
    
    // Prepare headers with cookies if available
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://www.bilibili.com/'
    }
    
    if (cookies) {
      headers.Cookie = cookies
    }
    
    const results = await $fetch(url, { 
      responseType: 'json',
      headers
    }) as MikufansSearchResponse
    const data = results.data
    if(!data) {
      return {
        platform: "bilibili",
        page: page,
        totalPage: page-1,
        results: []
      }
    }
    const unsavedUnparsedSongs: UnparsedSongWithoutId[] = []
    
    if (data.result.length <= 0) {
      return {
        platform: "bilibili",
        page: page,
        totalPage: -1,
        results: []
      }
    }
    
    const { artistLookup, albumLookup, songLookup } = await createLookupMaps(
      data.result,
      (song) => [song.author],
      (song) => song.title,
      (song) => `https://www.bilibili.com/video/${song.bvid}` as unknown as string
    )
    for (const res of data.result) {
      const url = `https://www.bilibili.com/video/${res.bvid}`
      let name = res.title
      if (res.description) {
        name += `(${res.description})`
      }
      
      if (songLookup.has(url)) {
        continue
      }
      const artists = processArtist(res.author, res.mid.toString(), "bilibili", artistLookup)
      const picUrl = res.pic
      const album = processAlbum(
        "bilibili: " + res.bvid,
        res.bvid,
        "bilibili",
        picUrl,
        albumLookup
      )
      const song: UnparsedSongWithoutId = {
        src: url,
        name: name,
        artists: [artists],
        album,
        duration: res.duration.split(':').reduce((acc, curr, index) => acc + (index === 0 ? Number(curr) * 60 : Number(curr)), 0),
        platform: "bilibili"
      }
      unsavedUnparsedSongs.push(song)
    }

    return {
      platform: "bilibili",
      page: page,
      totalPage: data.numPages,
      results: unsavedUnparsedSongs
    }
  } catch (error) {
    throw new Error(`Error searching in platform 'bilibili': ${error}`)
  }
}
