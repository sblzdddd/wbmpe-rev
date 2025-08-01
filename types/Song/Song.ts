import type { SimpleArtist } from "../Artist/SimpleArtist";
import type { SimpleAlbum } from "../Album/SimpleAlbum";
import type { TimeMetadata } from "../time_metadata";

export type Song = {
  _id: string;
  src: string;
  name: string;
  artists: SimpleArtist[];
  album: SimpleAlbum;
  duration: number;
} & TimeMetadata

