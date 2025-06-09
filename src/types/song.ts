export interface Song {
  id: number;
  src: string;
  name: string;
  artistNames: string;
  albumId: number;
  artists: number[];
  album: string|null;
  duration: number;
  pic?: string;
  hasSubtitles: boolean|null;
  addedTime: number;
  is_favourite: boolean;
  is_parsed: boolean|null;
}
export interface SongList {
  length: number;
  page: number;
  max_page: number;
  songs: Song[];
}