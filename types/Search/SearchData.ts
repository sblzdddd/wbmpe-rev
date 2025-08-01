import type { UnparsedSong } from "./UnparsedSongs"

export interface SearchResponse {
  platform: string
  page: number
  totalPage: number
  results: UnparsedSong[]
}

export interface BilibiliPage {
  thumb: string
  name: string
  page: number
}

export interface SearchSongRequest {
  platform: string
  keyword: string
  page: number
}

export interface GetSuggestionsRequest {
  keyword: string
  platform?: string
}

export interface GetBilibiliPagesRequest {
  url: string
}