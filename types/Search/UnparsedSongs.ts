import type { SongType } from "../Song"
import type { TimeMetadata } from "../time_metadata"

export type UnparsedArtist = {
  name: string
  platform: string
  id: string
}

export type UnparsedAlbum = {
  name: string
  platform: string
  coverUrl: string
  id: string
}

export type UnparsedSongType = Omit<SongType, "artists" | "album"> & {
  platform: string
  artists: UnparsedArtist[]
  album: UnparsedAlbum
} & TimeMetadata

export type UnparsedSongWithoutId = Omit<UnparsedSongType, "_id">
