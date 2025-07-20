import type { SongItem, SongList } from "../../types/Song";

export function paginate<T>(data: T[], page: number, limit: number): T[] {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  // console.log("startIndex", startIndex)
  // console.log("endIndex", endIndex)
  const results = data.slice(startIndex, endIndex);
  return results;
}

export const createSongList = (data: SongItem[], page: number, limit: number): SongList => {
  const totalSongs = data?.length || 0;
  const maxPage = Math.ceil(totalSongs / limit);
  // console.log("original data", data)
  const songs = paginate(data || [], page, limit) as SongItem[]
  return {
    length: totalSongs,
    page: page,
    max_page: maxPage,
    songs: songs
  }
}