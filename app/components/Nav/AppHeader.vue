<script setup lang="ts">
import Image from '../Image.vue'
import Input from '../ui/input/Input.vue';
import Button from '../ui/button/Button.vue';
import UserInfo from './UserInfo.vue';
import LoginDialog from '../Auth/LoginDialog.vue';
import ForgotPasswordDialog from '../Auth/ForgotPasswordDialog.vue';
import PlaylistHeader from '../Playlist/Header.vue';

const colorMode = useColorMode()
const { isOnTop } = useScrollBar()
const route = useRoute()
const { open, toggleSidebar } = useSidebar()

// Use the search composable
const { 
  searchKeyword,
  performSearch
} = useSearch()

withDefaults(defineProps<{
  containerAttrs?: unknown
}>(), {
  containerAttrs: () => ({})
})

const { scrollY } = useScrollBar()

const isPlaylistPage = computed(() => route.path.includes('/playlists/') && !route.path.includes('/edit'))

const headerInputRef = ref<HTMLInputElement>()

const handleHeaderKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    performSearch()
  } else if (event.key === 'Escape') {
    headerInputRef.value?.blur()
  }
}


</script>

<template>
  <div
    class="sticky top-0 shrink-0 z-[50]"
  >
    <div
      class="header-wrapper relative z-30 w-full transition-[background-color,border-color] duration-200"
      :class="`${isOnTop ? '' : 'bg-sidebar/80 backdrop-blur-sm border-b-[1.5px]'}`"
    >
      <header class="flex h-12 md:h-16 items-center" v-bind="containerAttrs || {}">
        <div v-if="!open" class="hidden md:flex items-center gap-1 mr-2 ">
          <ClientOnly fallback-tag="div" class="min-w-37 min-h-7.5">
            <Image v-if="colorMode.value === 'light'" src="/images/logo/logo-light_256.png" alt="logo" class="min-w-37 min-h-7.5" />
            <Image v-else src="/images/logo/logo-dark_256.png" alt="logo" class="min-w-37 min-h-7.5" />
            <template #fallback>
              <!-- Fallback for SSR - use a neutral logo or placeholder -->
              <Image src="/images/logo/logo-light_256.png" alt="logo" class="min-w-37 min-h-7.5" />
            </template>
          </ClientOnly>
        </div>
        <Button variant="ghost" size="icon" class="md:pr-2 flex lg:hidden size-6" @click="toggleSidebar">
          <Icon name="lucide:list" size="20" />
        </Button>
        <div v-if="route.path !== '/search'" class="relative w-full max-w-sm mx-2 md:mx-0">
          <Input 
            ref="headerInputRef"
            v-model="searchKeyword"
            type="text" 
            placeholder="Search songs, artists, albums, and URL" 
            class="w-full max-w-sm pl-10"
            @keydown="handleHeaderKeydown"
          />
          <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
            <Icon name="lucide:search" size="16" />
          </span>
        </div>
        <div class="md:grow w-8" />
        <div class="flex items-center gap-2">
          <UserInfo />
          <LoginDialog />
          <ForgotPasswordDialog />

          <!-- <Widget-WindowButtons/> -->
        </div>
      </header>
    </div>
    <div v-if="scrollY > 225 && isPlaylistPage" class="w-full border-t py-2 absolute top-12 md:top-16 left-0 bg-sidebar/80 backdrop-blur-sm border-b-[1.5px] z-10">
      <Playlist-Header v-bind="containerAttrs || {}" />
    </div>
  </div>
</template>

<style scoped>
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
