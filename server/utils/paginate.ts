export function paginate<T>(data: T[], page: number, limit: number): T[] {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const results = data.slice(startIndex, endIndex);
  return results;
}

export const createSongList = (data: SongItemType[], page: number, limit: number): SongListType => {
  const totalSongs = data?.length || 0;
  const maxPage = Math.ceil(totalSongs / limit);
  const songs = paginate(data || [], page, limit) as SongItemType[]
  return {
    length: totalSongs,
    page: page,
    max_page: maxPage,
    songs: songs
  }
}