import type { SimpleArtist } from "../Artist";
import type { SongList } from "../Song";
import type { TimeMetadata } from "../time_metadata";

export type SimpleAlbum = {
  _id: string;
  name: string;
  coverUrl: string;
} & TimeMetadata

export type AlbumData = {
  _id: string;
  artists: SimpleArtist[];
  coverUrl: string;
  name: string;
  description: string;
  songList: SongList;
} & TimeMetadata
