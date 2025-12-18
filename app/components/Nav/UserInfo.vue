<script setup lang="ts">
import { fallbackUserInfo } from '~/lib/fallback_data';
import Image from '../Image.vue';
import Button from '../ui/button/Button.vue';
import ThemeSwitcher from '../Widget/ThemeSwitcher.vue';
import UserPanelInbox from './UserPanelInbox.vue';

const colorMode = useColorMode()
const { openDialog } = useDialog()

await useFetch('/api/user/me', {
  key: 'userInfo',
  default: () => (fallbackUserInfo)
})
const { user, loggedIn, logout } = useAuth()

// User panel state management
const { showUserPanel, showUserPanelDOM, isOnTop, closeUserPanel, toggleUserPanel, onToggleClicked } = useUserPanel()

const handleLogout = async () => {
  closeUserPanel(async () => await logout())
}

const userDisplayName = computed(() => {
  return user.data.value?.nickName || user.data.value?.userName || 'Unnamed User'
})
</script>

<template>
  <div v-if="loggedIn && user.data.value" class="flex items-center gap-2">
    <div class="user-info-root">
      <div class="user-avatar">
        <Image :src="user.data.value.avatarUrl || '/images/default_avatar.jpg'" alt="avatar" :img-attrs="{class: 'w-5 h-5'}" />
      </div>
      <span class="user-name">{{ userDisplayName }}</span>
      <div class="user-panel-toggle" :class="{'user-panel-toggle--interactive': !showUserPanel}" @click="onToggleClicked">
        <Icon name="lucide:align-justify" size="14" class="user-panel-toggle-icon" :class="{'user-panel-toggle-icon--light-open': colorMode.value == 'light' && showUserPanel}" />
        <div v-show="showUserPanelDOM" class="user-panel-root">
          <div class="user-panel-backdrop" :class="{'backdrop-blur-md': isOnTop}" />
          <div class="user-panel-header" style="opacity: 0;">
            <ThemeSwitcher class="rounded-full" />
            <Button variant="ghost" size="icon" class="w-7 h-7 rounded-full" @click.stop="toggleUserPanel">
              <Icon name="lucide:align-justify" size="14" />
            </Button>
          </div>
          <div class="user-panel-content" style="opacity: 0;">
            <div class="user-panel-user-info">
              <div class="user-panel-avatar">
                <Image class="w-full h-full" :src="user.data.value.avatarUrl || '/images/default_avatar.jpg'" alt="avatar" />
              </div>
              <div class="flex flex-col gap-2">
                <span class="user-panel-name">{{ userDisplayName }}</span>
                <div class="flex gap-1">
                  <Button variant="outline" size="sm" class="h-8 rounded-full" @click="navigateTo('/profile')">
                    <Icon name="lucide:user" size="16" /> Profile
                  </Button>
                  <Button variant="outline" size="icon" class="w-8 h-8 rounded-full" @click.stop="handleLogout">
                    <Icon name="lucide:log-out" size="16" />
                  </Button>
                </div>
              </div>
            </div>
            <UserPanelInbox />
          </div>
        </div>
      </div>
    </div>
  </div>
  <Button v-else variant="ghost" size="icon" class="h-8 md:w-20 pl-2 md:pl-0" @click.stop="openDialog?.call(null, DialogType.LOGIN)">
    <Icon name="lucide:log-in" size="16" /> 
    <span class="hidden md:block text-xs mb-0.5">Login</span>
  </Button>
</template>

<style scoped>
@reference "../../assets/css/tailwind.css";

.user-info-root {
  @apply text-sm flex items-center gap-2;
}

.user-avatar {
  @apply w-5 h-5 rounded-full hidden sm:flex items-center justify-center overflow-hidden;
}

.user-name {
  @apply text-xs font-light hidden sm:block;
}

.user-panel-toggle {
  @apply rounded-full w-7 h-7 relative flex items-center justify-center bg-primary;
}

.user-panel-toggle--interactive {
  @apply cursor-pointer;
}

.user-panel-toggle-icon {
  @apply z-80 text-white pointer-events-none transition-all duration-200;
}

.user-panel-toggle-icon--light-open {
  @apply !text-black;
}

.user-panel-root {
  @apply absolute top-0 right-0 z-[60] flex flex-col rounded-lg;
}

.user-panel-backdrop {
  @apply absolute top-0 right-0 z-0 rounded-[17px] shadow-2xl;
}

.user-panel-header {
  @apply relative z-10 flex justify-end gap-2;
}

.user-panel-avatar {
  @apply rounded-full flex items-center justify-center overflow-hidden size-14;
}

.user-panel-name {
  @apply text-base pl-1;
}

.user-panel-content {
  @apply p-1 flex flex-col relative z-10;
}

.user-panel-user-info {
  @apply flex items-center gap-2 relative mb-2 px-2;
}


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