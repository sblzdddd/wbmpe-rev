<template>
  <div>album {{ id }}</div>
</template>
<script setup lang="ts">
// import type { AlbumResponse } from '~/types/Album/index'

const route = useRoute()
const id = route.params.id

// const album = ref<AlbumResponse | null>(null)

// const getAlbum = async () => {
//   const response = await $fetch<AlbumResponse>(`/api/albums/${id}`)
//   album.value = response.data
// }

// onMounted(async () => {
//   await getAlbum()
// })
</script>