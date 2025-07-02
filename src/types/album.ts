import type { SimpleArtist } from "./artist";
import type { SongList } from "./song";

export interface SimpleAlbum {
  _id: string;
  name: string;
  coverUrl: string;
}

export interface AlbumData {
  _id: string;
  artists: SimpleArtist[];
  coverUrl: string;
  name: string;
  description: string;
  songList: SongList;
}