/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ArtistLookupMaps {
  artistLookup: Map<string, any>
  albumLookup: Map<string, any>
  songLookup: Map<string, SongType>
}

/**
 * Collects unique artist and album names from a list of items
 */
export function collectUniqueNames<T>(
  items: T[],
  getArtistNames: (item: T) => string[],
  getAlbumName: (item: T) => string,
  getSongSrc: (item: T) => string
): { artistNames: Set<string>, albumNames: Set<string>, songSrcs: Set<string> } {
  const artistNames = new Set<string>()
  const albumNames = new Set<string>()
  const songSrcs = new Set<string>()
  for (const item of items) {
    const artists = getArtistNames(item)
    for (const artistName of artists) {
      artistNames.add(artistName)
    }
    albumNames.add(getAlbumName(item))
    songSrcs.add(getSongSrc(item))
  }
  
  return { artistNames, albumNames, songSrcs }
}

/**
 * Performs bulk queries for artists and albums and creates lookup maps
 */
export async function createLookupMaps<T>(
  items: T[],
  getArtistNames: (item: T) => string[],
  getAlbumName: (item: T) => string,
  getSongSrc: (item: T) => string
): Promise<ArtistLookupMaps> {
  const { artistNames, albumNames, songSrcs } = collectUniqueNames(items, getArtistNames, getAlbumName, getSongSrc)
  // Bulk query for all artists and albums
  const [localArtists, localAlbums, localSongs] = await Promise.all([
    Artists.find({ name: { $in: Array.from(artistNames) } }),
    Albums.find({ name: { $in: Array.from(albumNames) } }),
    Songs.getMultipleFullInfo(Array.from(songSrcs) as string[])
  ])

  // Create lookup maps for O(1) access
  const artistLookup = new Map(localArtists.map(artist => [String(artist.name), artist]))
  const albumLookup = new Map(localAlbums.map(album => [String(album.name), album]))
  const songLookup = new Map(localSongs.map(song => [String(song?.src), song as unknown as SongType]))

  return { artistLookup, albumLookup, songLookup }
}

/**
 * Processes an artist, checking if it exists locally or creating external reference
 */
export function processArtist(
  artistName: string,
  externalId: string,
  platform: SourcePlatformTypes,
  artistLookup: Map<string, any>
): UnparsedArtistType {
  const localArtist = artistLookup.get(artistName)
  
  if (localArtist) {
    return {
      name: localArtist.name,
      platform: "local" as SourcePlatformTypes,
      id: localArtist._id.toString()
    }
  } else {
    return {
      name: artistName,
      platform: platform,
      id: externalId
    }
  }
}

/**
 * Processes an album, checking if it exists locally or creating external reference
 */
export function processAlbum(
  albumName: string,
  externalId: string,
  platform: SourcePlatformTypes,
  externalCoverUrl: string,
  albumLookup: Map<string, any>
): UnparsedAlbumType {
  const localAlbum = albumLookup.get(albumName)
  
  if (localAlbum) {
    return {
      name: localAlbum.name as string,
      platform: "local" as SourcePlatformTypes,
      id: localAlbum._id.toString(),
      coverUrl: localAlbum.coverUrl as string
    }
  } else {
    return {
      name: albumName,
      platform: platform,
      id: externalId,
      coverUrl: externalCoverUrl
    }
  }
}
