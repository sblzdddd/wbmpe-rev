import BakaLogger from './logger/BakaLogger';

const logger = BakaLogger.child({ service: 'NeteaseArtist' });

export interface NeteaseArtist {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  briefDesc?: string;
}

export interface NeteaseArtistResponse {
  code: number;
  data?: {
    artist: {
      id: string;
      name: string;
      briefDesc?: string;
      avatar?: string;
    };
  };
}

interface NeteaseSongDetailResponse {
  songs: Array<{
    id: number;
    ar: Array<{
      id: number;
      name: string;
    }>;
  }>;
}

export interface NeteaseSearchArtistResponse {
  code: number;
  result: {
    artists: Array<{
      id: number;
      name: string;
    }>;
  };
}

/**
 * Get singer info from song IDs
 */
export async function getSingerInfoFromSong(songIds: number[]): Promise<NeteaseArtist[]> {
  try {
    const query = songIds.map(songId => ({ id: songId }));
    logger.info('Getting singer info from songs:', query);
    
    const queryString = JSON.stringify(query);
    const url = `https://music.163.com/api/v3/song/detail?c=${queryString}`;
    
    const response = await $fetch<NeteaseSongDetailResponse>(url);
    const results: NeteaseArtist[] = [];
    
    for (const song of response.songs) {
      logger.info('Processing artists for song:', song.ar);
      for (const artist of song.ar) {
        const artistInfo = await getSingerInfo(artist.id.toString(), artist.name);
        if (artistInfo) {
          results.push(artistInfo);
        }
      }
    }
    
    return results;
  } catch (error) {
    logger.error('Error getting singer info from songs:', error);
    return [];
  }
}

/**
 * Get singer info by ID
 */
export async function getSingerInfo(id: string, defaultName: string = "Unknown"): Promise<NeteaseArtist> {
  try {
    const url = `https://interface.music.163.com/api/artist/head/info/get?id=${id}`;
    const response = await $fetch<NeteaseArtistResponse>(url);
    
    if (response.code === 200 && response.data?.artist) {
      const artist = response.data.artist;
      return {
        id: artist.id,
        name: artist.name,
        description: artist.briefDesc || '',
        avatarUrl: artist.avatar || ''
      };
    } else {
      logger.warn(`Failed to get artist info for ID ${id}, using default name: ${defaultName}`);
      return {
        id,
        name: defaultName,
        description: '',
        avatarUrl: ''
      };
    }
  } catch (error) {
    logger.error('Error getting singer info:', error);
    return {
      id,
      name: defaultName,
      description: '',
      avatarUrl: ''
    };
  }
}

/**
 * Search for a singer by name
 */
export async function searchSinger(name: string): Promise<NeteaseArtist> {
  try {
    const url = `https://interface.music.163.com/api/cloudsearch/pc?s=${encodeURIComponent(name)}&type=100`;
    const response = await $fetch<NeteaseSearchArtistResponse>(url);
    
    if (response.result?.artists && response.result.artists.length > 0) {
      const firstArtist = response.result.artists[0];
      return await getSingerInfo(firstArtist.id.toString(), firstArtist.name);
    } else {
      logger.warn(`No singer found for name: ${name}`);
      return {
        id: "0",
        name,
        description: '',
        avatarUrl: ''
      };
    }
  } catch (error) {
    logger.error('Error searching singer:', error);
    return {
      id: "0",
      name,
      description: '',
      avatarUrl: ''
    };
  }
}

/**
 * Search for multiple singers by comma-separated names
 */
export async function searchSingers(name: string): Promise<NeteaseArtist[]> {
  const singers = name.split(', ');
  const results: NeteaseArtist[] = [];
  
  for (const singerName of singers) {
    const singer = await searchSinger(singerName.trim());
    if (singer) {
      results.push(singer);
    }
  }
  
  return results;
}
