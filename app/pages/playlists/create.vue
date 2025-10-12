<script setup lang="ts">
import type { SEOData } from '#types/Utils/SEO';

const { paddingClass } = useContentPadding();
const seoData = useState<SEOData>('seoData')

seoData.value.title = 'Create Playlist'
seoData.value.description = 'Create a new playlist'
seoData.value.ogTitle = 'Create Playlist'
seoData.value.ogDescription = 'Create a new playlist'
</script>

<template>
  <div :class="paddingClass">
    <div class="flex flex-col mt-8 mb-16 mx-16">
      <Playlist-CreateForm />
    </div>
  </div>
</template>