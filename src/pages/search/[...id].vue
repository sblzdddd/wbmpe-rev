<template>
  <div>
    <div class="flex flex-col gap-4">search</div>
  </div>
</template>
<script setup lang="ts">
const route = useRoute()

const searchId = computed(() => route.params.id)

console.log(searchId.value)
</script>