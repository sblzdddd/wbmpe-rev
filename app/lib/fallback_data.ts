export const fallbackPlaylist = {
  data: {
    _id: "",
    playlistType: "playlist" as const,
    coverUrl: "",
    name: "",
    description: "",
    createdAt: "",
    updatedAt: "",
    isPublic: false,
    owner: {
      _id: "",
      userName: "",
      nickName: "",
      avatarUrl: "",
      bio: ""
    },
    songList: {
      length: 0,
      page: 0,
      max_page: 0,
      songs: []
    }
  }
}

export const fallbackQueue = {
  songs: [],
  currentTime: 0,
  currentIndex: -1
}

export const fallbackUserPlaylists = {
  playlists: {
    createdPlaylists: []
  }
}

export const fallbackUserInfo = {
  user: undefined
}

export const fallbackExplorePage = {
  data: {
    categories: [],
    items: []
  }
}

export const fallbackHomePage = {
  data: {
    banner: [],
    card_recom: [],
    recom: [],
    categories: []
  }
}
