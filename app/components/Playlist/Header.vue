<template>
  <div class="w-full" v-bind="$attrs">
    <div class="w-full mx-auto px-4 md:px-0 flex items-center gap-4" :class="{'lg:!w-[90%]': !open}">
      <Picture
        v-if="playlist.data.value?.data?.coverUrl" 
        :src="playlist.data.value?.data?.coverUrl" 
        class="min-w-10 h-10 md:min-w-10 md:h-10 rounded-sm overflow-hidden" 
        :modifiers="{resize: {s: 128}}" 
        :alt="`Playlist ${playlist.data.value?.data?._id}`"
        :img-attrs="{class: 'w-full h-full object-cover'}"
      />
      <div class="flex flex-col grow gap-2">
        <h1 class="text-base md:text-2xl font-bold">{{ playlist.data.value?.data?.name }}</h1>
      </div>
      <div class="grow" />
      <Button variant="outline" size="icon">
        <Icon name="lucide:plus" size="16" />
      </Button>
      <NuxtLink :to="`/playlists/${id}/edit`">
        <Button variant="outline" size="icon">
          <Icon name="lucide:edit" size="16" />
        </Button>
      </NuxtLink>
      <Button size="icon" @click="playAll">
        <Icon name="lucide:play" size="16" />
      </Button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useSidebar } from '~/components/ui/sidebar';

const route = useRoute();
const id = route.params.id;
const { open } = useSidebar()


const { playlist, playAll } = usePlaylistPage(id);
</script>