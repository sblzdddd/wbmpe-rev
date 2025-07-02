import type { SimpleArtist } from "./artist";
import type { SimpleAlbum } from "./album";
import type { TimeMetadata } from "./time_metadata";

export type Song = {
  _id: string;
  src: string;
  name: string;
  artists: SimpleArtist[];
  album: SimpleAlbum;
  duration: number;
  isFavourite: boolean;
} & TimeMetadata

export type SongItem = {
  _id: string;
  song: Song;
} & TimeMetadata

export type SongList = {
  length: number;
  page: number;
  max_page: number;
  songs: SongItem[];
}