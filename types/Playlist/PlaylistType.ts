import type { SimpleUser } from "../User";
import type { TimeMetadata } from "../time_metadata";
import type { SongListType, SongItemType } from "../Song";

export type PlaylistResponse = {
  data: PaginatedPlaylist;
}

export type PlaylistInfo = {  
  _id: string;
  playlistType: "playlist" | "favorites" | "recent";
  coverUrl: string;
  name: string;
  description: string;
  isPublic: boolean;
  owner: SimpleUser;
} & TimeMetadata

export type PlaylistMeta = {
  _id: string;
  coverUrl: string|null;
  name: string;
  isPublic: boolean;
}

export type PaginatedPlaylist = PlaylistInfo & {
  songList: SongListType;
}

export type FullPlaylist = PlaylistInfo & {
  songs: SongItemType[];
}
