import type { PlaylistMeta } from "../Playlist/Playlist";

export type SimpleUser = {
  _id: string;
  userName: string;
  nickName: string;
  avatarUrl: string;
  bio: string|null;
}

export type UserInfo = {
  _id: string;
  userName: string;
  nickName: string;
  avatarUrl: string;
  bio: string|null;
  createdPlaylists: PlaylistMeta[];
  favorites: PlaylistMeta|null;
  recent: PlaylistMeta|null;
}

export type UserInfoResponse = {
  user: UserInfo;
}
