import type { SongItem, SongList } from "./song";
import type { TimeMetadata } from "./time_metadata";
import type { SimpleUser } from "./user";

export type PaginatedPlaylist = {
  _id: string;
  coverUrl: string;
  name: string;
  description: string;
  owner: SimpleUser;
  songList: SongList;
} & TimeMetadata

export type FullPlaylist = {
  _id: string;
  coverUrl: string;
  name: string;
  description: string;
  owner: SimpleUser;
  songs: SongItem[];
} & TimeMetadata

export type PlaylistInfo = {
  _id: string;
  coverUrl: string;
  name: string;
  description: string;
  owner: SimpleUser;
} & TimeMetadata

export type PlaylistResponse = {
  data: PaginatedPlaylist;
}

