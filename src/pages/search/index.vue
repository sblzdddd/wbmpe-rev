<script setup lang="ts">
import Image from '~/components/Widget/Image.vue'

const search = ref('')
</script>

<template>
  <div class="flex flex-1 flex-col gap-14 items-center justify-center p-4 pt-0">
    <Image src="/images/logo/logo-search_1024.png" alt="search" class="w-[90%] sm:w-[80%] md:w-[60%] lg:w-[40%]" />
    <div class="flex gap-0 w-full max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mb-[30vh]">

      <div class="relative w-full">
        <Input v-model="search" size="lg" placeholder="Search songs, artists, albums, and URL" class="w-full h-12 pl-10 text-lg rounded-r-none" />
        <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
          <Icon name="lucide:search" size="18" />
        </span>
      </div>
      
      <Button class="h-full rounded-l-none" size="lg">
        Submit
      </Button>
    </div>
  </div>
</template>
