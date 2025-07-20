import type { TimeMetadata } from "../time_metadata";
import type { SongList } from "../Song";

export type Artist = {
  _id: string;
  name: string;
  description: string;
  avatarUrl: string;
  songList: SongList;
} & TimeMetadata
    