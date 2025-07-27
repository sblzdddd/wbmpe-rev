<template>
  <div>
    <div class="flex flex-col gap-4">search</div>
  </div>
</template>
<script setup lang="ts">
import type { SEOData } from '#types/Utils/SEO';

const seoData = useState<SEOData>('seoData')

seoData.value.title = 'Search Result - WBMPE Rev'
seoData.value.description = 'Search Result - WBMPE Rev'
seoData.value.ogTitle = 'Search Result - WBMPE Rev'

const route = useRoute()

const searchId = computed(() => route.params.id)

console.log(searchId.value)
</script>