import type { SimpleArtist } from "#types/Artist";
import type { SimpleAlbum } from "#types/Album";
import type { TimeMetadata } from "../time_metadata";

export type SongType = {
  _id: string;
  src: string;
  name: string;
  artists: SimpleArtist[];
  album: SimpleAlbum;
  duration: number;
  addedBy?: string;
} & TimeMetadata

