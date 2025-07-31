<script setup lang="ts">
import { useSidebar } from '#shadcn/sidebar/utils'

const colorMode = useColorMode()
const { isOnTop } = useScrollBar()
const route = useRoute()
const { open, toggleSidebar } = useSidebar()

// Create a computed that safely handles SSR
const logoSrc = computed(() => {
  return colorMode.value === 'light' 
    ? '/images/logo/logo-light_256.png' 
    : '/images/logo/logo-dark_256.png'
})

withDefaults(defineProps<{
  containerAttrs?: unknown
}>(), {
  containerAttrs: () => ({})
})

const { scrollY } = useScrollBar()

const isPlaylistPage = computed(() => route.path.includes('/playlists/') && !route.path.includes('/edit'))



</script>

<template>
  <div
    class="sticky top-0 shrink-0 z-[50]"
  >
    <div
      class="header-wrapper w-full transition-[background-color,border-color] duration-200"
      :class="`${isOnTop ? '' : 'bg-sidebar/80 backdrop-blur-sm border-b-[1.5px]'}`"
    >
      <header class="flex h-12 md:h-16 items-center" v-bind="containerAttrs">
        <div v-if="!open" class="flex items-center gap-1 mr-2 ">
          <ClientOnly fallback-tag="div" class="min-w-37 min-h-7.5">
            <Image :src="logoSrc" alt="logo" class="min-w-37 min-h-7.5 hidden md:block" />
            <template #fallback>
              <!-- Fallback for SSR - use a neutral logo or placeholder -->
              <Image src="/images/logo/logo-light_256.png" alt="logo" class="min-w-37 min-h-7.5 hidden md:block" />
            </template>
          </ClientOnly>
        </div>
        <Button variant="ghost" size="icon" class="h-q0 pr-2 flex lg:hidden" @click="toggleSidebar">
          <Icon name="lucide:list" size="20" />
        </Button>
        <div v-if="route.path !== '/search'" class="relative w-full max-w-sm">
          <Input type="text" placeholder="Search songs, artists, albums, and URL" class="w-full max-w-sm pl-10" />
          <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
            <Icon name="lucide:search" size="16" />
          </span>
        </div>
        <div class="grow" />
        <div class="flex items-center gap-2">
          <Nav-UserInfo />
          <Auth-LoginDialog />
          <Auth-ForgotPasswordDialog />

          <!-- <Widget-WindowButtons/> -->
        </div>
      </header>
    </div>
    <div v-if="scrollY > 225 && isPlaylistPage" class="w-full border-t py-2 absolute top-12 md:top-16 left-0 bg-sidebar/80 backdrop-blur-sm border-b-[1.5px]">
      <Playlist-Header v-bind="containerAttrs" />
    </div>
  </div>
</template>

<style scoped>
/* Optional: Add any additional styles if needed */
.user-panel-enter-active,
.user-panel-leave-active {
  transition: all 0.3s ease;
}

.user-panel-enter-from,
.user-panel-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}
</style>
