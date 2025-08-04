import type { TimeMetadata } from "../time_metadata";
import type { SongListType } from "../Song";

export type ArtistType = {
  _id: string;
  name: string;
  description: string;
  avatarUrl: string;
  songList: SongListType;
} & TimeMetadata
    