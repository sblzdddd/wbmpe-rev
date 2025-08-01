import type { SearchResponse } from '../../../../types/Search/SearchData'
import type { UnparsedSong } from '#types/Search/UnparsedSongs'

export async function searchSongBilibili(_keyword: string, page: number): Promise<SearchResponse> {
  try {
    // For now, we'll implement a simplified version without bilibili-api dependency
    // This would need to be updated with proper bilibili search API
    // const realPage = Math.ceil(page / 2)
    
    // Placeholder implementation - in production this would use bilibili-api
    const mockResults: UnparsedSong[] = []
    
    return {
      platform: "bilibili",
      page: page,
      totalPage: -1,
      results: mockResults
    }
  } catch (error) {
    throw new Error(`Error searching in platform 'bilibili': ${error}`)
  }
}
