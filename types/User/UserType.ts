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
} & UserPlaylists;

export type UserInfoResponse = {
  user: UserInfo;
}
