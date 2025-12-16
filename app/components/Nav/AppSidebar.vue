<script setup lang="ts">
import { fallbackUserPlaylists } from '~/lib/fallback_data';
import type { SidebarProps } from "~/components/ui/sidebar"

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})

const isFullscreen = useState<boolean>('isFullscreen', () => false)

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
    <Transition name="titlebar" mode="out-in">
      <SidebarHeader v-if="!isFullscreen">
        <Nav-Title />
      </SidebarHeader>
    </Transition>
    <SidebarContent class="gap-0 transition-all duration-300 ease-out" :class="{'fullscreen-mode': isFullscreen}">
      <Nav-Main :data="data.navMain" />
      <Nav-Playlist 
        v-if="loggedIn && playlists.data.value"
        :data="playlists.data.value.createdPlaylists" 
        :favorites="playlists.data.value.favorites ?? null" 
        :recent="playlists.data.value.recent ?? null" 
      />
    </SidebarContent>
    <div v-if="isFullscreen" class="h-16"></div>
    <!-- <SidebarFooter>
      <NavUser :user="data.user" />
    </SidebarFooter> -->
  </Sidebar>
</template>

<style scoped>
@reference '../../assets/css/tailwind.css';

.fullscreen-mode {
  @apply translate-x-[-50%] hover:translate-x-0 opacity-0 hover:opacity-100;
}
</style>
