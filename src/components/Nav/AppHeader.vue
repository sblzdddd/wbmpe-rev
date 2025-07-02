<script setup lang="ts">
import {Button} from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar/utils'
import { Input } from '@/components/ui/input'
import Image from '~/components/Widget/Image.vue'
import { useAuth } from '@/composables/useAuth'
import { useDialog, DialogType } from '~/composables/useDialog'

const colorMode = useColorMode()
const { isOnTop } = useScroll()
const route = useRoute()
const { open } = useSidebar()
const { openDialog } = useDialog()
const { user, isAuthenticated, logout } = useAuth()

const handleLogout = async () => {
  await logout()
}
</script>

<template>
  <header class="sticky top-0 flex h-16 shrink-0 items-center gap-2 z-[50] transition-[background-color,border-color] duration-200" :class="isOnTop ? '' : 'bg-sidebar border-b-[1.5px] h-[65px]'">
    <div class="flex items-center gap-1 pl-2">
      <template v-if="!open">
        <Image v-if="colorMode.preference === 'dark'" src="/images/logo/logo-dark_256.png" alt="logo" img-class="w-36" />
        <Image v-else src="/images/logo/logo-light_256.png" alt="logo" img-class="w-36" />
      </template>
    </div>
    <Button variant="ghost" size="icon" class="h-7 w-7">
      <Icon name="lucide:chevron-left" size="20" />
    </Button>
    <div v-if="route.path !== '/search'" class="relative w-full max-w-sm">
      <Input type="text" placeholder="Search songs, artists, albums, and URL" class="w-full max-w-sm pl-10" />
      <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
        <Icon name="lucide:search" size="16" />
      </span>
    </div>
    <div class="grow" />
    <ClientOnly>
      <div class="flex items-center gap-2 px-4">
        <div v-if="isAuthenticated && user" class="flex items-center gap-2">
          <div class="text-sm">
            <Image v-if="user.avatarUrl" :src="user.avatarUrl" alt="avatar" img-class="w-4 h-4 rounded-full mr-2" />
            <Icon v-else name="lucide:user" class="translate-y-0.5 mr-2" size="16" />
            <span class="font-medium">{{ user.nickName || user.userName }}</span>
          </div>
          <Button variant="ghost" size="sm" @click="handleLogout">
            <Icon name="lucide:log-out" size="16" />
            <span class="ml-1">Logout</span>
          </Button>
        </div>
        <Button v-else variant="ghost" size="icon" class="h-8 w-20 mr-2" @click="openDialog?.call(null, DialogType.LOGIN)">
          <Icon name="lucide:user" size="16" /> 
          <span class="text-xs mb-0.5">Login</span>
        </Button>
        <LoginDialog />
        <RegisterDialog />
        <Widget-ThemeSwitcher/>
        <Widget-WindowButtons/>
      </div>
    </ClientOnly>
  </header>
</template>
