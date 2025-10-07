<script lang="ts" setup>
import AppBackdrop from '@/components/Background/AppBackdrop.vue'
import type { RoutePath } from "#types/Utils/RoutePath"
import AppHeader from '@/components/Nav/AppHeader.vue'
import AppSidebar from '@/components/Nav/AppSidebar.vue'
import PlayBar from '@/components/Player/PlayBar.vue'
import SidebarProvider from '~/components/ui/sidebar/SidebarProvider.vue'
import SidebarInset from '~/components/ui/sidebar/SidebarInset.vue'

const router = useRouter();
const backgroundStore = useBackground();
const { paddingClass } = useContentPadding()
const { clearSearch } = useSearch()

const route = useRoute();

const routePath = useState<RoutePath>('routePath', () => ({
  last: '',
  next: route.path
}))

router.beforeEach((to, from, next) => {
  if (to.path === '/') {
    backgroundStore.resetBackground();
  }
  if(!to.path.includes('/search')) {
    clearSearch()
  }
  routePath.value.last = from.path
  routePath.value.next = to.path
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
    <AppSidebar />
    <SidebarInset class="bg-transparent">
      <AppHeader :container-attrs="{class: 'w-full px-4 md:px-0 ' + paddingClass}" />
      <div class="w-full h-full mb-10" :class="paddingClass">
        <slot />
      </div>
    </SidebarInset>
    <PlayBar />
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
<style>
.scrollbar-container {
  @apply relative w-screen h-screen overflow-x-hidden overflow-y-auto;
}

.scrollbar__thumb {
  background-color: var(--secondary);
}
</style>
