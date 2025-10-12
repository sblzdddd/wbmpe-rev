<script setup lang="ts">
import { fallbackUserPlaylists } from '~/lib/fallback_data';
import type { SidebarProps } from "~/components/ui/sidebar"

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})


// This is sample data.
const data = {
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

await useFetch('/api/user/playlists', {
  key: 'userPlaylists',
  default: () => (fallbackUserPlaylists)
})

const { playlists } = useUserPlaylist()
const { loggedIn } = useAuth()

</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <Nav-Title />
    </SidebarHeader>
    <SidebarContent class="gap-0">
      <Nav-Main :data="data.navMain" />
      <Nav-Playlist 
        v-if="loggedIn && playlists.data.value"
        :data="playlists.data.value.createdPlaylists" 
        :favorites="playlists.data.value.favorites ?? null" 
        :recent="playlists.data.value.recent ?? null" 
      />
    </SidebarContent>
    <!-- <SidebarFooter>
      <NavUser :user="data.user" />
    </SidebarFooter> -->
  </Sidebar>
</template>
