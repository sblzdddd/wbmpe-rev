import type { SongType } from "./SongType";
import type { TimeMetadata } from "../time_metadata";

export type SongItemType = {
  _id: string;
  song: SongType;
} & TimeMetadata

export type SongListType = {
  length: number;
  page: number;
  max_page: number;
  songs: SongItemType[];
}