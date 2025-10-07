import type { SongListType } from "../Song";
import type { TimeMetadata } from "../time_metadata";

export type SimpleArtist = {
  _id: string;
  name: string;
  avatarUrl?: string;
  platform?: string;
} & TimeMetadata
