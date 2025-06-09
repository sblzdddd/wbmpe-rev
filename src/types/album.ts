import type { SongList } from "./song";

export interface AlbumData {
  id: number;
  pic: string;
  name: string;
  description: string;
  length: number;
  page: number;
  max_page: number;
  songs: SongList;
}