import type { SimpleUser } from "../User";
import type { TimeMetadata } from "../time_metadata";
import type { SongList, SongItem } from "../Song";

export type PlaylistResponse = {
  data: PaginatedPlaylist;
}

export type PlaylistInfo = {  
  _id: string;
  playlistType: "playlist" | "favorites" | "recent";
  coverUrl: string;
  name: string;
  description: string;
  owner: SimpleUser;
} & TimeMetadata

export type PlaylistMeta = {
  _id: string;
  coverUrl: string|null;
  name: string;
}

export type PaginatedPlaylist = PlaylistInfo & {
  songList: SongList;
}

export type FullPlaylist = PlaylistInfo & {
  songs: SongItem[];
}
