import type { SimpleArtist } from "../Artist";
import type { SongListType, SongItemType } from "../Song";
import type { TimeMetadata } from "../time_metadata";

export type SimpleAlbum = {
  _id: string;
  name: string;
  coverUrl: string;
  platform?: string;
} & TimeMetadata

export type AlbumInfo = {  
  _id: string;
  name: string;
  coverUrl?: string;
  description?: string;
  platform: string;
  artists: SimpleArtist[];
} & TimeMetadata

export type AlbumResponse = {
  data: PaginatedAlbum;
}

export type PaginatedAlbum = AlbumInfo & {
  songList: SongListType;
}

export type FullAlbum = AlbumInfo & {
  songs: SongItemType[];
}

export type AlbumData = {
  _id: string;
  artists: SimpleArtist[];
  coverUrl: string;
  name: string;
  description: string;
  songList: SongListType;
} & TimeMetadata
