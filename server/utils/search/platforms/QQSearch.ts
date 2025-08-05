import type { QQSearchResponse, SuggestionResponse } from './Schemas'
import { createLookupMaps, processArtist, processAlbum } from '../search_util'

export async function searchSongQQ(keyword: string, page: number): Promise<SearchReturnType> {
  try {
    const length = 10
    const url = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?aggr=1&cr=1&flag_qc=0&p=${page}&n=${length}&w=${keyword}`
    const response = await $fetch(url, {responseType: 'text'}) as string
    const unsavedUnparsedSongs: UnparsedSongWithoutId[] = []
    
    const responseJson = response.replace(/^callback\(/, '').replace(/\)$/, '')
    const data = JSON.parse(responseJson) as QQSearchResponse
    const sInfo = data.data.song.list

    // Filter out paid songs and collect unique names
    const validSongs = sInfo.filter(item => item.pay.payplay !== 1)

    // Create lookup maps for local artists and albums
    const { artistLookup, albumLookup, songLookup } = await createLookupMaps(
      validSongs,
      (item) => item.singer.map(s => s.name),
      (item) => item.albumname,
      (item) => item.grp?.[0]?.songurl || `https://y.qq.com/n/ryqq/songDetail/${item.songmid}`
    )

    for (const item of sInfo) {
      if (item.pay.payplay === 1) continue

      const title = item.songname
      const picUrl = `https://y.gtimg.cn/music/photo_new/T002R300x300M000${item.albummid || item.grp[0].albummid || ''}.jpg?max_age=2592000`
      const src = item.grp?.[0]?.songurl || `https://y.qq.com/n/ryqq/songDetail/${item.songmid}`
      const duration = item.interval

      if (songLookup.has(src)) {
        continue
      }

      // Process artists using shared utility
      const artists = item.singer.map(s => 
        processArtist(s.name, s.mid, "qq" as SourcePlatforms, artistLookup)
      )

      // Process album using shared utility
      const album = processAlbum(
        item.albumname,
        item.albummid,
        "qq" as SourcePlatforms,
        picUrl,
        albumLookup
      )

      const unparsedSong: UnparsedSongWithoutId = {
        src: src,
        name: title,
        artists: artists,
        album: album,
        duration: duration,
        platform: "qq" as SourcePlatforms
      }

      unsavedUnparsedSongs.push(unparsedSong)
    }
    
    return {
      platform: "qq",
      page: page,
      totalPage: Math.ceil(data.data.song.totalnum / 20),
      results: unsavedUnparsedSongs
    }
  } catch (error) {
    throw new Error(`Error searching '${keyword}' in platform 'qq': ${error}`)
  }
}

export async function getSuggestions(keyword: string): Promise<string[]> {
  try {
    const url = `https://c6.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?format=json&key=${keyword}`
    const response = await $fetch(url, {responseType: 'json'})
    const info = response as SuggestionResponse
    return [...info.data.song.itemlist.map(i => i.name), ...info.data.album.itemlist.map(i => i.name), ...info.data.singer.itemlist.map(i => i.name)]
  } catch (error) {
    throw new Error(`Error getting suggestions for '${keyword}': ${error}`)
  }
}