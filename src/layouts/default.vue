<script lang="ts" setup>
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import bg from '@/assets/images/bg.jpg'

defineOptions({
  name: "DefaultLayout",
});
</script>
<template>
  <SidebarProvider>
    <img class="absolute top-0 left-0 w-full h-full z-[-1] mask opacity-25 dark:opacity-50" :src="bg" >
    <Nav-AppSidebar />
    <SidebarInset class="bg-transparent">
      <Nav-AppHeader />
      <NuxtPage />
    </SidebarInset>
  </SidebarProvider>
</template>
<style lang="postcss">
.page-enter-active,
.page-leave-active {
  transition: all 0.15s ease-out;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}

.page-enter-from {
  transform: translateX(60px);
}

.page-wrapper {
  width: 100%;
  height: 100%;
}
.mask {
  mask-image: linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0) 65%);
}
</style>
