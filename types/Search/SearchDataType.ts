import type { UnparsedSongType, UnparsedSongWithoutId } from "./UnparsedSongs"

export interface SearchResponseType {
  platform: string
  page: number
  totalPage: number
  results: UnparsedSongType[]
}

export interface SearchReturnType {
  platform: string
  page: number
  totalPage: number
  results: UnparsedSongWithoutId[]
}

export interface BilibiliPageType {
  thumb: string
  name: string
  page: number
}

export interface SearchSongRequestType {
  platform: string
  keyword: string
  page: number
}

export interface GetBilibiliPagesRequestType {
  url: string
}
