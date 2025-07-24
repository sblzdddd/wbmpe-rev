<script setup lang="ts">
const { paddingClass } = useContentPadding();
</script>

<template>
  <div :class="paddingClass">
    <div class="flex flex-col mt-8 mb-16 mx-16">
      <Playlist-CreateForm />
    </div>
  </div>
</template>