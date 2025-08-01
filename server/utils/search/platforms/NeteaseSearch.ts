import type { SearchResponse } from '../../../../types/Search/SearchData'
import type { NeteaseSearchResponse } from './Schemas'
import type { SourcePlatform, UnparsedSongWithoutId } from '#types/Search/UnparsedSongs'
import UnparsedSongs from '~~/server/models/UnparsedSongs'
import { createLookupMaps, processArtist, processAlbum } from '../search_util'

async function encryptId(songId: number): Promise<string> {
  const magic = '3go8&$8*3*3h0k(2)2'
  const songIdList = songId.toString().split('')

  for (let i = 0; i < songIdList.length; i++) {
    songIdList[i] = String.fromCharCode(songIdList[i].charCodeAt(0) ^ magic[i % magic.length].charCodeAt(0))
  }

  const crypto = await import('crypto')
  const result = crypto.createHash('md5').update(songIdList.join('')).digest()
  const encodedResult = Buffer.from(result).toString('base64')

  return encodedResult.replace(/\//g, '_').replace(/\+/g, '-')
}

export async function searchSongNetease(keyword: string, page: number): Promise<SearchResponse> {
  try {
    const offset = (page - 1) * 20
    const url = `https://music.163.com/api/search/get/web?csrf_token=hlpretag=&hlposttag=&s=${keyword}&type=1&offset=${offset}&total=true&limit=20`
    
    const response = await $fetch(url, { responseType: 'json' })
    const result = response as NeteaseSearchResponse
    const unsavedUnparsedSongs: UnparsedSongWithoutId[] = []

    if (result.result.songCount <= 0) {
      return {
        platform: "netease",
        page: page,
        totalPage: -1,
        results: []
      }
    }

    const { artistLookup, albumLookup } = await createLookupMaps(
      result.result.songs,
      (song) => song.artists.map(artist => artist.name),
      (song) => song.album.name,
      (song) => `https://music.163.com/#/song?id=${song.id}`
    )

    for (const res of result.result.songs) {
      const url = `https://music.163.com/#/song?id=${res.id}`
      let name = res.name
      if (res.transNames) {
        name += `(${res.transNames[0]})`
      }
      // Process artists using shared utility
      const artists = res.artists.map(neteaseArtist => 
        processArtist(neteaseArtist.name, neteaseArtist.id.toString(), "netease" as SourcePlatform, artistLookup)
      )
      const picId = res.album.picId
      const picUrl = `https://p3.music.126.net/${await encryptId(picId)}/${picId}.jpg?param=150y150`
      // Process album using shared utility
      const album = processAlbum(
        res.album.name,
        res.album.id.toString(),
        "netease" as SourcePlatform,
        picUrl,
        albumLookup
      )
      
      const unparsedSong: UnparsedSongWithoutId = {
        src: url,
        name: name,
        artists: artists,
        album: album,
        duration: res.duration,
        platform: "netease" as SourcePlatform
      }

      unsavedUnparsedSongs.push(unparsedSong)
    }
    const unparsedSongs = await UnparsedSongs.addSongs(unsavedUnparsedSongs)
    console.log("search module completed")

    return {
      platform: "netease",
      page: page,
      totalPage: -1,
      results: unparsedSongs
    }
  } catch (error) {
    throw new Error(`Error searching '${keyword}' in platform 'netease': ${error}`)
  }
}