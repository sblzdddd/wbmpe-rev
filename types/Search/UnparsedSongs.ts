import type { SongType } from "../Song"
import type { TimeMetadata } from "../time_metadata"

export type SourcePlatforms = "netease" | "qq" | "bilibili" | "local"

export type UnparsedArtist = {
  name: string
  platform: SourcePlatforms
  id: string
}

export type UnparsedAlbum = {
  name: string
  platform: SourcePlatforms
  coverUrl: string
  id: string
}

export type UnparsedSongType = Omit<SongType, "artists" | "album"> & {
  platform: SourcePlatforms
  artists: UnparsedArtist[]
  album: UnparsedAlbum
} & TimeMetadata

export type UnparsedSongWithoutId = Omit<UnparsedSongType, "_id">
