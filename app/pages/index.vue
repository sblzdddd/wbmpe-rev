<script setup lang="ts">
import type { SEOData } from '#types/Utils/SEO';
import { fallbackHomePage } from '~/lib/fallback_data';

const seoData = useState<SEOData>('seoData')

seoData.value.title = 'Home - WBMPE Rev'
seoData.value.description = 'Home - WBMPE Rev'
seoData.value.ogTitle = 'Home - WBMPE Rev'

const { data: homeData } = await useFetch<HomeResponse>('/api/home', {
  key: 'home-page',
  default: () => (fallbackHomePage)
})

</script>

<template>
  <div class="flex flex-1 flex-col gap-4">
    <div class="flex gap-4 mt-6 mb-6 md:mb-16 justify-start h-44">
      <Home-Top-Banner-Card :banner="homeData?.data?.banner" class="w-full max-w-md banner !rounded-xl shadow-sm overflow-hidden relative" />
      <Home-Top-Recommend-Card :data="homeData?.data?.card_recom" class="hidden md:flex w-full max-w-md" />
    </div>
    <div v-for="item in homeData?.data?.recom" :key="item.title" class="recom-item w-full grid grid-cols-1">
      <Home-Recommend-Row :data="item" />
    </div>
  </div>
</template>