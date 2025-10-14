<script lang="ts" setup>
import AppBackdrop from '@/components/Background/AppBackdrop.vue'
import type { RoutePath } from "#types/Utils/RoutePath"
import AppHeader from '@/components/Nav/AppHeader.vue'
import AppSidebar from '@/components/Nav/AppSidebar.vue'
import PlayBar from '@/components/Player/PlayBar.vue'
import FullscreenPlayer from '@/components/Player/FullscreenPlayer.vue'

const router = useRouter();
const backgroundStore = useBackground();
const { paddingClass } = useContentPadding()
const { clearSearch } = useSearch()

const route = useRoute();

const routePath = useState<RoutePath>('routePath', () => ({
  last: '',
  next: route.path
}))

// App-level fullscreen state
const isFullscreen = useState<boolean>('isFullscreen', () => false)

const exitAppFullscreen = async () => {
  isFullscreen.value = false
}

router.beforeEach((to, from, next) => {
  if(!to.path.includes('/search')) {
    clearSearch()
  }
  routePath.value.last = from.path
  routePath.value.next = to.path
  if(isFullscreen.value) {
    isFullscreen.value = false
    nextTick().then(() => {
      next()
    })
    return
  }
  next();
});

defineOptions({
  name: "DefaultLayout",
});


</script>
<template>
  <SidebarProvider>
    <img 
      class="fixed top-0 left-0 w-full h-full z-[-2] transition-opacity duration-500 ease-in-out object-cover opacity-[0.05] dark:opacity-60"
      :style="{ maskImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0) 75%)' }"
      src="/images/bg.jpg"
    >
    <AppBackdrop />

    <AppSidebar />
      <div class="w-full min-h-screen">
        <SidebarInset class="bg-transparent h-full">
          <Transition name="titlebar" mode="out-in">
            <AppHeader v-if="!isFullscreen" :container-attrs="{class: 'w-full px-4 md:px-0 ' + paddingClass}" />
          </Transition>
          <Transition name="layout" mode="out-in">
            <div v-if="!isFullscreen" class="w-full h-full mb-10" :class="paddingClass">
              <slot />
            </div>
            <div v-else class="fixed inset-0 z-50 flex flex-col">
              <FullscreenPlayer @exit="exitAppFullscreen" />
            </div>
          </Transition>
        </SidebarInset>
      </div>
    <Transition name="playbar" mode="out-in">
      <PlayBar v-if="!isFullscreen" />
    </Transition>
  </SidebarProvider>
</template>
<style>
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
  transition: all 0.25s ease-out;
}

.layout-enter-from,
.layout-leave-to {
  opacity: 0;
}
.playbar-enter-active,
.playbar-leave-active {
  transition: all 0.3s ease-out;
}

.playbar-enter-from,
.playbar-leave-to {
  opacity: 0;
  transform: translateY(80px);
}

.playbar-wrapper {
  width: 100%;
  height: 100%;
}
.titlebar-enter-active,
.titlebar-leave-active {
  transition: all 0.3s ease-out;
}

.titlebar-enter-from,
.titlebar-leave-to {
  opacity: 0;
  transform: translateY(-80px);
}

.titlebar-wrapper {
  width: 100%;
  height: 100%;
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
