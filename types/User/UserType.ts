import type { PlaylistMeta } from "#types/Playlist";

export type SimpleUser = {
  _id: string;
  userName: string;
  nickName: string;
  avatarUrl: string;
  bio: string|null;
}

export type UserPlaylists = {
  createdPlaylists: PlaylistMeta[];
  favorites: PlaylistMeta|null;
  recent: PlaylistMeta|null;
}

export type UserInfo = {
  _id: string;
  userName: string;
  nickName: string;
  avatarUrl: string;
  bio: string|null;
  subscribedArtists: Array<{_id: string, name: string, avatarUrl?: string}>;
  subscribedAlbums: Array<{_id: string, name: string, coverUrl?: string}>;
  subscribedPlaylists: Array<{_id: string, name: string, coverUrl?: string}>;
} & UserPlaylists;

export type UserInfoResponse = {
  user: UserInfo;
}
