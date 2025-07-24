<script lang="ts" setup>
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import AppBackdrop from '@/components/Background/AppBackdrop.vue'

const router = useRouter();
const backgroundStore = useBackground();
const { setLastPath } = useRouterHistory()

router.beforeEach((to, from, next) => {
  if (to.path === '/') {
    backgroundStore.resetBackground();
  }
  setLastPath(from.path)
  console.log('from', from.path, 'to', to.path)
  next();
});

defineOptions({
  name: "DefaultLayout",
});
</script>
<template>
  <SidebarProvider>
    <img 
      class="absolute top-0 left-0 w-full h-full z-[-2] transition-opacity duration-500 ease-in-out object-cover opacity-10 dark:opacity-60"
      :style="{ maskImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0) 75%)' }"
      src="/images/bg.jpg"
    >
    <AppBackdrop />
    <Nav-AppSidebar />
    <SidebarInset class="bg-transparent">
      <Nav-AppHeader />
      <slot />
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
  transform: translateY(10px);
}

.page-wrapper {
  width: 100%;
  height: 100%;
}

.layout-enter-active,
.layout-leave-active {
  transition: all 0.05s ease-out;
}

.layout-enter-from,
.layout-leave-to {
  opacity: 0;
}
</style>
