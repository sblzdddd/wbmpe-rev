import type { Song } from "../Song"
import type { TimeMetadata } from "../time_metadata"

export type SourcePlatform = "netease" | "qq" | "bilibili" | "local"

export type UnparsedArtist = {
  name: string
  platform: SourcePlatform
  id: string
}

export type UnparsedAlbum = {
  name: string
  platform: SourcePlatform
  coverUrl: string
  id: string
}

export type UnparsedSong = Omit<Song, "artists" | "album"> & {
  platform: SourcePlatform
  artists: UnparsedArtist[]
  album: UnparsedAlbum
} & TimeMetadata

export type UnparsedSongWithoutId = Omit<UnparsedSong, "_id">
