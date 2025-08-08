import BakaLogger from './logger/BakaLogger';

const logger = BakaLogger.child({ service: 'NeteaseAlbum' });

export interface NeteaseAlbum {
  id: string;
  name: string;
  publishTime?: number;
  coverUrl?: string;
  description?: string;
}

export interface NeteaseAlbumResponse {
  code: number;
  album?: {
    id: number;
    name: string;
    artist: {
      id: number;
      name: string;
    };
    publishTime: number;
    picUrl?: string;
    description?: string;
  };
}

export interface NeteaseSongDetailResponse {
  songs: Array<{
    id: number;
    al: {
      id: number;
      name: string;
      picUrl?: string;
    };
    ar: Array<{
      id: number;
      name: string;
    }>;
  }>;
}

export interface NeteaseSearchAlbumResponse {
  result: {
    albums: Array<{
      id: number;
      name: string;
      description?: string;
      picUrl?: string;
    }>;
  };
}

/**
 * Get album info by album ID
 */
export async function getAlbumInfo(albumId: string, defaultName: string = "Unknown"): Promise<NeteaseAlbum> {
  try {
    const url = `https://music.163.com/api/album/detail?id=${albumId}`;
    const response = await $fetch<NeteaseAlbumResponse>(url);
    
    if (response.code === 200 && response.album) {
      const album = response.album;
      return {
        id: album.id.toString(),
        name: album.name,
        publishTime: album.publishTime,
        coverUrl: album.picUrl,
        description: album.description
      };
    } else {
      logger.warn(`Failed to get album info for ID ${albumId}`);
      return {
        id: albumId,
        name: defaultName,
        coverUrl: '',
        description: ''
      };
    }
  } catch (error) {
    logger.error('Error getting album info:', error);
    return {
      id: albumId,
      name: defaultName,
      coverUrl: '',
      description: ''
    };
  }
}

/**
 * Get album info from song IDs
 */
export async function getAlbumInfoFromSong(songIds: string[]): Promise<NeteaseAlbum[]> {
  try {
    const query = songIds.map(songId => ({ id: songId }));
    logger.info('Getting album info from songs:', query);
    
    const queryString = JSON.stringify(query);
    const url = `https://music.163.com/api/v3/song/detail?c=${queryString}`;
    
    const response = await $fetch<NeteaseSongDetailResponse>(url);
    const results: NeteaseAlbum[] = [];
    const processedAlbumIds = new Set<string>();
    
    for (const song of response.songs) {
      logger.info('Processing album for song:', song.al);
      
      // Avoid duplicate albums
      if (!processedAlbumIds.has(song.al.id.toString())) {
        processedAlbumIds.add(song.al.id.toString());
        
        const albumInfo = await getAlbumInfo(song.al.id.toString(), song.al.name);
        if (albumInfo) {
          results.push(albumInfo);
        }
      }
    }
    
    return results;
  } catch (error) {
    logger.error('Error getting album info from songs:', error);
    return [];
  }
}

/**
 * Search for a album by name
 */
export async function searchAlbum(name: string): Promise<NeteaseAlbum> {
  try {
    const url = `https://interface.music.163.com/api/cloudsearch/pc?s=${encodeURIComponent(name)}&type=10`;
    const response = await $fetch<NeteaseSearchAlbumResponse>(url);
    
    if (response.result?.albums && response.result.albums.length > 0) {
      const firstAlbum = response.result.albums[0];
      return {
        id: firstAlbum.id.toString(),
        name: firstAlbum.name,
        description: firstAlbum.description || '',
        coverUrl: firstAlbum.picUrl
      };
    } else {
      logger.warn(`No album found for name: ${name}`);
      return {
        id: "0",
        name,
        description: 'Not found',
        coverUrl: ''
      };
    }
  } catch (error) {
    logger.error('Error searching album:', error);
    return {
      id: "0",
      name,
      description: 'Not found',
      coverUrl: ''
    };
  }
}