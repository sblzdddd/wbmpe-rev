<template>
  <!-- <NuxtPwaManifest /> -->
  <NuxtLoadingIndicator color="#658eff"/>
  <NuxtLayout>
    <NuxtPage/>
  </NuxtLayout>
</template>
<script setup lang="ts">
const seoData = useState('seoData', () => ({
  title: 'WBMPE Rev',
  description: 'WBMPE Rev',
  ogTitle: 'WBMPE Rev',
  ogDescription: 'WBMPE Rev',
  ogImage: 'https://wbmpe.com/images/icon/icon_180.png',
  twitterCard: 'summary_large_image' as const,
}))

useHead({
  title: computed(() => seoData.value.title),
  meta: [
    { name: 'description', content: computed(() => seoData.value.description) }
  ],
})

useSeoMeta({
  title: computed(() => seoData.value.title),
  description: computed(() => seoData.value.description),
  ogTitle: computed(() => seoData.value.ogTitle),
  ogDescription: computed(() => seoData.value.ogDescription),
  ogImage: computed(() => seoData.value.ogImage),
  twitterCard: computed(() => seoData.value.twitterCard),
})
</script>
