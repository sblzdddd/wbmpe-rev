import type { TimeMetadata } from "../time_metadata";

export type SimpleArtist = {
  _id: string;
  name: string;
} & TimeMetadata
