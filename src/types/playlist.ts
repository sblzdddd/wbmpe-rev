import type { SongList } from "./song";
import type { TimeMetadata } from "./time_metadata";
import type { SimpleUser } from "./user";

export type Playlist = {
  _id: string;
  coverUrl: string;
  name: string;
  description: string;
  owner: SimpleUser;
  songList: SongList;
} & TimeMetadata

export interface PlaylistResponse {
  data: Playlist;
}