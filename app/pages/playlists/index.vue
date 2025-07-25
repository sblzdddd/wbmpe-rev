<script setup lang="ts">
import type { SEOData } from '#types/Utils/SEO';

const seoData = useState<SEOData>('seoData')

seoData.value.title = 'Playlists'
seoData.value.description = 'Playlists'
seoData.value.ogTitle = 'Playlists'
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
    <div class="grid auto-rows-min gap-4 md:grid-cols-3">
      <div class="bg-muted/50 aspect-video rounded-xl" />
      <div class="bg-muted/50 aspect-video rounded-xl" />
      <div class="bg-muted/50 aspect-video rounded-xl" />
    </div>
    <div class="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
  </div>
</template>
