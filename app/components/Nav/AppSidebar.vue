<script setup lang="ts">
import type { SidebarProps } from '#shadcn/sidebar'

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})

// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      name: "Discover",
      items: [
        {
          title: 'Your Daily',
          url: '/',
          icon: 'lucide:home',
          isActive: true,
        },
        {
          title: 'Explore',
          url: '/explore',
          icon: 'lucide:compass',
        },
        {
          title: 'Search',
          url: '/search',
          icon: 'lucide:search',
        },
        {
          title: 'WSP',
          url: '/wsp',
          icon: 'lucide:share-2',
        },
      ]
    },
    {
      name: "Library",
      items: [
        {
          title: 'Songs',
          url: '/songs',
          icon: 'lucide:music',
          isActive: true,
        },
        {
          title: 'Albums',
          url: '/albums',
          icon: 'lucide:disc-album',
        },
        {
          title: 'Artists',
          url: '/artists',
          icon: 'lucide:user',
        },
        {
          title: 'Playlists',
          url: '/playlists',
          icon: 'lucide:list-video',
        },
      ]
    },
  ],
}

const playlistStore = usePlaylistStore()

// Transform createdPlaylists to match NavPlaylist data structure
const playlistData = computed(() => {
  return playlistStore.createdPlaylists.map(playlist => ({
    name: playlist.name,
    url: `/playlists/${playlist._id}`,
    icon: 'lucide:list-music',
    canEdit: true
  }))
})
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <NavTitle />
    </SidebarHeader>
    <SidebarContent class="gap-0">
      <NavMain :data="data.navMain" />
      <NavPlaylist :data="playlistData" />
    </SidebarContent>
    <!-- <SidebarFooter>
      <NavUser :user="data.user" />
    </SidebarFooter> -->
  </Sidebar>
</template>
