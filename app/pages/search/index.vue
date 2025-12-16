<script setup lang="ts">
import type { SEOData } from '#types/Utils/SEO';

const seoData = useState<SEOData>('seoData')

seoData.value.title = 'Search - WBMPE Rev'
seoData.value.description = 'Search - WBMPE Rev'
seoData.value.ogTitle = 'Search - WBMPE Rev'

const { 
  searchKeyword,
  performSearch,
} = useSearch()


const handleSubmit = () => {
  performSearch()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    handleSubmit()
  }
}
</script>

<template>
  <div class="w-full h-full flex flex-1 flex-col gap-14 items-center justify-center p-4 pt-0">
    <Image src="/images/logo/logo-search_1024.png" alt="search" class="w-[90%] sm:w-[80%] md:w-[60%] lg:w-[40%]" />
    <div class="flex gap-0 w-full max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mb-[30vh]">

      <div class="relative w-full">
        <Input 
          ref="inputRef"
          v-model="searchKeyword" 
          size="lg" 
          placeholder="Search songs, artists, albums, and URL" 
          class="w-full h-12 pl-10 text-lg rounded-r-none" 
          @keydown="handleKeydown"
        />
        <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
          <Icon name="lucide:search" size="18" />
        </span>
      </div>
      
      <Button class="h-full rounded-l-none" size="lg" @click="handleSubmit">
        Submit
      </Button>
    </div>
  </div>
</template>
