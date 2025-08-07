<script setup lang="ts">
import { fallbackUserInfo } from '~/lib/fallback_data';

const colorMode = useColorMode()
const { openDialog } = useDialog()
const { isOnTop } = useScrollBar()

await useFetch('/api/user/me', {
  key: 'userInfo',
  default: () => (fallbackUserInfo)
})
const { user, logout } = useAuth()
const { activeTasks, recentTasks, notificationCount, isConnected } = useTasks()

// User panel state and refs
const showUserPanel = ref(false)
const showUserPanelDOM = ref(false)
const showUserInfo = ref(true)

const handleLogout = async () => {
  closeUserPanel(async () => await logout())
}

const toggleUserPanel = () => {
  if (showUserPanel.value) {
    closeUserPanel()
  } else {
    openUserPanel()
  }
}

let timeline: Timeline;

const primaryBGDark = "648dfeff"
const contentBGDark = "02061870"
const contentBGDarkSolid = "0c1327"
const primaryBGLight = "5f87f8ff"
const contentBGLight = "ffffff80"
const contentBGLightSolid = "ffffff"

const spring = createSpring({
  stiffness: 200,
  damping: 50,
  velocity: 18,
})

watch(() => colorMode.value, () => {
  if (showUserPanel.value) {
    if(isOnTop.value) {
      animate(".user-panel-backdrop", {
        backgroundColor: `#${colorMode.value == "dark" ? contentBGDark : contentBGLight}`,
        duration: 200,
      })
    } else {
      animate(".user-panel-backdrop", {
        backgroundColor: `#${colorMode.value == "dark" ? contentBGDarkSolid : contentBGLightSolid}`,
        duration: 200,
      })
    }
  } else {
    animate(".user-panel-backdrop", {
      backgroundColor: `#${colorMode.value == "dark" ? primaryBGDark : primaryBGLight}`,
      duration: 200,
    })
  }
})

watch(() => isOnTop.value, () => {
  if (!showUserPanel.value) return;
  if(isOnTop.value) {
    animate(".user-panel-backdrop", {
      backgroundColor: `#${colorMode.value == "dark" ? contentBGDark : contentBGLight}`,
      duration: 200,
    })
  } else {
    animate(".user-panel-backdrop", {
      backgroundColor: `#${colorMode.value == "dark" ? contentBGDarkSolid : contentBGLightSolid}`,
      duration: 200,
    })
  }
})

const openUserPanel = async () => {
  showUserPanel.value = true
  showUserPanelDOM.value = true
  showUserInfo.value = false
  await nextTick()

  const userPanelRoot = document.querySelector(".user-panel-root") as HTMLElement
  const userPanelBackdrop = document.querySelector(".user-panel-backdrop") as HTMLElement

  if(!userPanelBackdrop || !userPanelRoot) {
    console.warn("User panel backdrop or root not found")
    return
  }
  const backdropEndWidth = userPanelRoot.clientWidth || 240
  const backdropEndHeight = userPanelRoot.clientHeight || 500

  await nextTick()
  if (timeline) {
    timeline.cancel()
  }
  timeline = createTimeline({onComplete: () => {
    showUserPanelDOM.value = true
  }})
  timeline.add(userPanelBackdrop, {
    scale: 1.07,
    width: `${backdropEndWidth}px`,
    height: `${backdropEndHeight}px`,
    right: "0px",
    top: "0px",
    backgroundColor: `#${isOnTop.value ? colorMode.value == "dark" ? contentBGDark: contentBGLight : colorMode.value == "dark" ? contentBGDarkSolid: contentBGLightSolid}`,
    ease: spring,
  }, 0)
  timeline.add(".user-panel-header, .user-panel-content", {
    opacity: 1,
    ease: spring
  }, 150)
}

const closeUserPanel = async (callback: () => void = () => {}) => {
  showUserPanel.value = false
  showUserPanelDOM.value = true
  showUserInfo.value = false
  await nextTick()

  const userPanelRoot = document.querySelector(".user-panel-root") as HTMLElement
  const userPanelBackdrop = document.querySelector(".user-panel-backdrop") as HTMLElement

  if(!userPanelBackdrop || !userPanelRoot) {
    console.warn("User panel backdrop or root not found")
    return
  }

  const size = document.querySelector(".user-panel-toggle")?.clientWidth || 28
  if (timeline) {
    timeline.cancel()
  }
  await nextTick()
  timeline = createTimeline({onComplete: async () => {
    showUserInfo.value = true
    showUserPanelDOM.value = false
    callback()
  }})
  timeline.add(".user-panel-header, .user-panel-content", {
    opacity: 0,
    ease: spring
  }, 0)
  timeline.add(userPanelBackdrop, {
    scale: 1,
    width: `${size}px`,
    height: `${size}px`,
    right: "0px",
    top: "0px",
    backgroundColor: `#${colorMode.value == "dark" ? primaryBGDark : primaryBGLight}`,
    ease: spring,
  }, 0)
}

const onToggleClicked = () => {
  if(!showUserPanel.value) {toggleUserPanel()} 
}

// Outside click detection
const handleOutsideClick = (event: MouseEvent) => {
  if (!showUserPanel.value) return
  
  const target = event.target as HTMLElement
  const userPanelRoot = document.querySelector('.user-panel-root') as HTMLElement
  const userPanelToggle = document.querySelector('.user-panel-toggle') as HTMLElement
  
  // Check if click is outside the panel and toggle button
  if (userPanelRoot && userPanelToggle && 
      !userPanelRoot.contains(target) && 
      !userPanelToggle.contains(target)) {
    closeUserPanel()
  }
}

// Add/remove event listeners
onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <div v-if="user.data.value && user.data.value._id" class="flex items-center gap-2">
    <div class="user-info-root">
      <div class="user-avatar">
        <Image :src="user.data.value.avatarUrl || '/images/default_avatar.jpg'" alt="avatar" :img-attrs="{class: 'w-5 h-5'}" />
      </div>
      <span class="user-name">{{ user.data.value.nickName || user.data.value.userName }}</span>

      <div class="user-panel-toggle" :class="{'user-panel-toggle--interactive': !showUserPanel}" @click="onToggleClicked">
        <Icon name="lucide:align-justify" size="14" class="user-panel-toggle-icon" :class="{'user-panel-toggle-icon--light-open': colorMode.value == 'light' && showUserPanel}" />
        <div v-show="showUserPanelDOM" class="user-panel-root">
          <div class="user-panel-backdrop" :class="{'backdrop-blur-md': isOnTop}" />
          <div class="user-panel-header" style="opacity: 0;">
            <Widget-ThemeSwitcher class="rounded-full" />
            <Button variant="ghost" size="icon" class="w-7 h-7 rounded-full" @click.stop="toggleUserPanel">
              <Icon name="lucide:align-justify" size="14" />
            </Button>
          </div>
          <div class="user-panel-content" style="opacity: 0;">
            <div class="user-panel-user-info">
              <div class="user-panel-avatar">
                <Image class="size-18 min-size-18" :src="user.data.value.avatarUrl || '/images/default_avatar.jpg'" alt="avatar" />
              </div>
              <div class="flex flex-col gap-2">
                <span class="user-panel-name">{{ user.data.value.nickName || user.data.value.userName }}</span>
                <div class="flex">
                  <Button variant="outline" size="sm" class="h-8 rounded-full">
                    <Icon name="lucide:user" size="16" /> Profile
                  </Button>
                  <Button variant="outline" size="icon" class="w-8 h-8 rounded-full" @click.stop="handleLogout">
                    <Icon name="lucide:log-out" size="16" />
                  </Button>
                </div>
              </div>
            </div>
            <div class="user-panel-inbox">
              <div class="user-panel-inbox-header">
                <p class="user-panel-inbox-title">
                  <Icon name="lucide:inbox" size="16" /> 
                  Inbox
                  <span v-if="notificationCount > 0" class="notification-count">{{ notificationCount }}</span>
                </p>
                <div class="flex items-center gap-2">
                  <div v-if="isConnected" class="connection-status connected" title="Connected">
                    <Icon name="lucide:wifi" size="12" />
                  </div>
                  <div v-else class="connection-status disconnected" title="Disconnected">
                    <Icon name="lucide:wifi-off" size="12" />
                  </div>
                </div>
              </div>
              
              <!-- Active Tasks -->
              <div v-if="activeTasks.length > 0" class="user-panel-inbox-section">
                <h4 class="inbox-section-title">Processing</h4>
                <div class="inbox-task-list">
                  <div v-for="task in activeTasks" :key="task._id" class="inbox-task-item">
                    <div class="task-info">
                      <div class="task-title">{{ task.songName }}</div>
                      <div class="task-artist">{{ task.artistName }}</div>
                      <div class="task-status">{{ task.progressMessage || task.status }}</div>
                    </div>
                    <div class="task-progress">
                      <div class="progress-bar">
                        <div 
                          class="progress-fill" 
                          :style="{ width: task.progress + '%' }"
                          :class="{
                            'progress-downloading': task.status === 'downloading',
                            'progress-processing': task.status === 'processing',
                            'progress-pending': task.status === 'pending'
                          }"
                        ></div>
                      </div>
                      <div class="progress-text">{{ task.progress }}%</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Recent Completed Tasks -->
              <div v-if="recentTasks.length > 0" class="user-panel-inbox-section">
                <h4 class="inbox-section-title">Recent</h4>
                <div class="inbox-task-list">
                  <div v-for="task in recentTasks" :key="task._id" class="inbox-task-item completed">
                    <div class="task-info">
                      <div class="task-title">{{ task.songName }}</div>
                      <div class="task-artist">{{ task.artistName }}</div>
                      <div class="task-status">
                        <Icon 
                          :name="task.status === 'completed' ? 'lucide:check-circle' : 'lucide:x-circle'" 
                          size="12" 
                          :class="task.status === 'completed' ? 'text-green-500' : 'text-red-500'"
                        />
                        {{ task.status === 'completed' ? 'Completed' : 'Failed' }}
                        <span v-if="task.errorMessage" class="error-message">: {{ task.errorMessage }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Empty State -->
              <div v-if="activeTasks.length === 0 && recentTasks.length === 0" class="inbox-empty">
                <Icon name="lucide:inbox" size="24" class="opacity-50" />
                <p class="text-sm opacity-75">No parsing tasks</p>
              </div>
            </div>
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

/* User info root styles */
.user-info-root {
  @apply text-sm flex items-center gap-2;
}

/* User avatar styles */
.user-avatar {
  @apply w-5 h-5 rounded-full hidden md:flex items-center justify-center overflow-hidden;
}

/* User name styles */
.user-name {
  @apply text-xs font-light hidden md:block;
}

/* User panel toggle styles */
.user-panel-toggle {
  @apply rounded-full w-7 h-7 relative flex items-center justify-center bg-primary;
}

.user-panel-toggle--interactive {
  @apply cursor-pointer;
}

.user-panel-toggle-icon {
  @apply z-20 text-white pointer-events-none transition-all duration-200;
}

.user-panel-toggle-icon--light-open {
  @apply !text-black;
}

/* User panel root styles */
.user-panel-root {
  @apply absolute top-0 right-0 flex flex-col rounded-lg;
}

/* User panel backdrop styles */
.user-panel-backdrop {
  @apply absolute top-0 right-0 z-0 rounded-[17px] shadow-2xl;
}

/* User panel header styles */
.user-panel-header {
  @apply flex justify-end gap-2;
}

/* User panel avatar styles */
.user-panel-avatar {
  @apply rounded-full flex items-center justify-center overflow-hidden size-18;
}

/* User panel name styles */
.user-panel-name {
  @apply text-lg pl-1;
}

/* User panel content styles */
.user-panel-content {
  @apply p-2.5 flex flex-col relative;
}

/* User panel user info styles */
.user-panel-user-info {
  @apply flex items-center gap-2 relative mb-2;
}

/* User panel inbox styles */
.user-panel-inbox {
  @apply flex flex-col items-start gap-2 py-2 px-1 border-t border-border;
}

.user-panel-inbox-header {
  @apply flex justify-between w-full items-center;
}

.user-panel-inbox-title {
  @apply text-sm inline-flex items-center gap-2;
}

.user-panel-inbox-mark-read {
  @apply bg-none cursor-pointer text-xs opacity-50 flex items-center gap-1;
}

.notification-count {
  @apply bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 ml-2;
}

.connection-status {
  @apply flex items-center justify-center w-4 h-4 rounded-full;
}

.connection-status.connected {
  @apply bg-green-500/20 text-green-500;
}

.connection-status.disconnected {
  @apply bg-red-500/20 text-red-500;
}

.user-panel-inbox-section {
  @apply mb-4;
}

.inbox-section-title {
  @apply text-xs font-medium uppercase tracking-wide opacity-75 mb-2;
}

.inbox-task-list {
  @apply space-y-2;
}

.inbox-task-item {
  @apply p-2 rounded-md bg-black/5 dark:bg-white/5 border border-border/50;
}

.inbox-task-item.completed {
  @apply opacity-75;
}

.task-info {
  @apply mb-2;
}

.task-title {
  @apply text-sm font-medium truncate;
}

.task-artist {
  @apply text-xs opacity-75 truncate;
}

.task-status {
  @apply text-xs opacity-60 flex items-center gap-1 mt-1;
}

.task-progress {
  @apply flex items-center gap-2;
}

.progress-bar {
  @apply flex-1 h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full transition-all duration-300 ease-out;
}

.progress-pending {
  @apply bg-gray-400;
}

.progress-downloading {
  @apply bg-blue-500;
}

.progress-processing {
  @apply bg-yellow-500;
}

.progress-text {
  @apply text-xs font-mono opacity-75;
}

.inbox-empty {
  @apply flex flex-col items-center justify-center py-6 text-center;
}

.error-message {
  @apply text-red-500 text-xs;
}

/* Animation styles */
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