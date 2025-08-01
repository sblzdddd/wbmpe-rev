import type { SearchResponse } from '../../../../types/Search/SearchData'
import type { SourcePlatform, UnparsedSongWithoutId } from '#types/Search/UnparsedSongs'
import type { Song } from '#types/Song'
import UnparsedSongs from '~~/server/models/UnparsedSongs'
import type { QQSearchResponse } from './Schemas'
import { createLookupMaps, processArtist, processAlbum } from '../search_util'

export async function searchSongQQ(keyword: string, page: number): Promise<SearchResponse> {
  try {
    const url = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?aggr=1&cr=1&flag_qc=0&p=${page}&n=20&w=${keyword}`
    const response = await $fetch(url) as string
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
      const picUrl = `https://y.gtimg.cn/music/photo_new/T002R300x300M000${item.albummid}.jpg?max_age=2592000`
      const src = item.grp?.[0]?.songurl || `https://y.qq.com/n/ryqq/songDetail/${item.songmid}`
      const duration = item.interval

      if (songLookup.has(src)) {
        const song = songLookup.get(src) as Song

        const localSong: UnparsedSongWithoutId = {
          src: song.src as string,
          name: song.name,
          artists: song.artists.map(artist => ({
            name: artist.name,
            platform: "local" as SourcePlatform,
            id: artist._id.toString()
          })),
            album: {
            name: song.album.name as string,
            platform: "local" as SourcePlatform,
            id: song.album._id.toString(),
            coverUrl: song.album.coverUrl as string
          },
          duration: song.duration as number,
          platform: "qq" as SourcePlatform
        }

        unsavedUnparsedSongs.push(localSong)
        continue
      }

      // Process artists using shared utility
      const artists = item.singer.map(s => 
        processArtist(s.name, s.mid, "qq" as SourcePlatform, artistLookup)
      )

      // Process album using shared utility
      const album = processAlbum(
        item.albumname,
        item.albummid,
        "qq" as SourcePlatform,
        picUrl,
        albumLookup
      )

      const unparsedSong: UnparsedSongWithoutId = {
        src: src,
        name: title,
        artists: artists,
        album: album,
        duration: duration,
        platform: "qq" as SourcePlatform
      }

      unsavedUnparsedSongs.push(unparsedSong)
    }
    const unparsedSongs = await UnparsedSongs.addSongs(unsavedUnparsedSongs)
    return {
      platform: "qq",
      page: page,
      totalPage: Math.ceil(data.data.song.totalnum / 20),
      results: unparsedSongs
    }
  } catch (error) {
    throw new Error(`Error searching '${keyword}' in platform 'qq': ${error}`)
  }
}

export async function getSuggestions(keyword: string): Promise<string[]> {
  try {
    const url = `https://c6.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?format=json&key=${keyword}`
    const response = await $fetch(url)
    const info = response as { data: { song: { itemlist: Array<{ name: string; singer: string }> } } }
    
    return info.data.song.itemlist.map(i => i.name + i.singer)
  } catch (error) {
    throw new Error(`Error getting suggestions for '${keyword}': ${error}`)
  }
}