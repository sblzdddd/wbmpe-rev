import type { Song } from "./Song";
import type { TimeMetadata } from "../time_metadata";

export type SongItem = {
  _id: string;
  song: Song;
} & TimeMetadata

export type SongList = {
  length: number;
  page: number;
  max_page: number;
  songs: SongItem[];
}