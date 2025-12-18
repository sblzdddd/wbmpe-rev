<template>
  <div class="flex flex-col my-4 lg:my-16 mx-auto w-full" :class="{'lg:!w-[90%]': !open}">
    <div class="flex gap-4 md:gap-7 mb-6 px-4 md:px-0 items-center">
       <div class="!size-30 rounded-full overflow-hidden bg-muted/50 flex items-center justify-center">
         <Image :src="user.data.value?.avatarUrl || '/images/default_avatar.jpg'" alt="avatar" :img-attrs="{class: 'h-full !aspect-square object-cover'}" />
       </div>
       <div class="flex flex-col grow gap-2">
         <h1 class="text-base md:text-2xl font-bold">{{ user.data.value?.nickName || user.data.value?.userName }}</h1>
         <p class="text-xs md:text-sm text-muted-foreground">User ID: {{ user.data.value?.userName }}</p>
       </div>
    </div>

    <!-- Recommendations / Lists -->
    <div class="mt-8 px-4 md:px-0">
      
      <RecommendRow v-if="subscribedArtistsData.items.length > 0" :data="subscribedArtistsData" />
      <RecommendRow v-if="subscribedAlbumsData.items.length > 0" :data="subscribedAlbumsData" />
      <RecommendRow v-if="subscribedPlaylistsData.items.length > 0" :data="subscribedPlaylistsData" />
      
      <RecommendRow v-if="createdPlaylistsData.items.length > 0" :data="createdPlaylistsData" />

    </div>
  </div>
</template>

<script setup lang="ts">
import type { SEOData } from '#types/Utils/SEO';
import RecommendRow from '~/components/Home/RecommendRow.vue';
import Image from '~/components/Image.vue';

const seoData = useState<SEOData>('seoData')
const { open } = useSidebar()
const { setBackground } = useBackground();
const { user } = useAuth();

seoData.value.title = `Profile - ${user.data.value?.nickName || 'User'}`

// Construct data for RecommendRow
const subscribedArtistsData = computed(() => ({
  title: 'Subscribed Artists',
  items: user.data.value?.subscribedArtists?.filter((artist: any) => artist)?.map((artist: any) => ({
    image: artist.avatarUrl || '',
    link: `/artists/${artist._id}`,
    title: artist.name,
    artist: 'Artist'
  })) || []
}));

const subscribedAlbumsData = computed(() => ({
  title: 'Subscribed Albums',
  items: user.data.value?.subscribedAlbums?.filter((album: any) => album)?.map((album: any) => ({
    image: album.coverUrl || '',
    link: `/albums/${album._id}`,
    title: album.name,
    artist: 'Album'
  })) || []
}));

const subscribedPlaylistsData = computed(() => ({
  title: 'Subscribed Playlists',
  items: user.data.value?.subscribedPlaylists?.filter((playlist: any) => playlist)?.map((playlist: any) => ({
    image: playlist.coverUrl || '',
    link: `/playlists/${playlist._id}`,
    title: playlist.name,
    artist: 'Playlist'
  })) || []
}));

const createdPlaylistsData = computed(() => ({
  title: 'Created Playlists',
  items: user.data.value?.createdPlaylists?.filter((playlist: any) => playlist)?.map((playlist: any) => ({
    image: playlist.coverUrl || '',
    link: `/playlists/${playlist._id}`,
    title: playlist.name,
    artist: 'Playlist'
  })) || []
}));

</script>
