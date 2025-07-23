<script setup lang="ts">
import { useSidebar } from '#shadcn/sidebar/utils'

const colorMode = useColorMode()
const { isOnTop } = useScrollBar()
const route = useRoute()
const { open } = useSidebar()
const { paddingClass } = useContentPadding()
</script>

<template>
  <header 
    class="sticky top-0 flex h-16 shrink-0 items-center z-[50] transition-[background-color,border-color] duration-200" 
    :class="`${isOnTop ? '' : 'bg-sidebar border-b-[1.5px] h-[65px]'} ${paddingClass}`"
  >
    <div v-if="!open" class="flex items-center gap-1 mr-2">
      <Image v-if="colorMode.value === 'dark'" src="/images/logo/logo-dark_256.png" alt="logo" img-class="min-w-36 min-h-7.5" />
      <Image v-else src="/images/logo/logo-light_256.png" alt="logo" img-class="min-w-36 min-h-7.5" />
    </div>
    <!-- <Button variant="ghost" size="icon" class="h-7 w-7 hidden lg:block">
      <Icon name="lucide:chevron-left" size="20" />
    </Button> -->
    <div v-if="route.path !== '/search'" class="relative w-full max-w-sm">
      <Input type="text" placeholder="Search songs, artists, albums, and URL" class="w-full max-w-sm pl-10" />
      <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
        <Icon name="lucide:search" size="16" />
      </span>
    </div>
    <div class="grow" />
    <ClientOnly>
      <div class="flex items-center gap-2">
        <Nav-UserInfo />
        <Auth-LoginDialog />
        <Auth-ForgotPasswordDialog />
        <!-- <Widget-WindowButtons/> -->
      </div>
    </ClientOnly>
  </header>
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
