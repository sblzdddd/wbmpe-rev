<script setup lang="ts">

const colorMode = useColorMode()
const { openDialog } = useDialog()


await useFetch('/api/user/me', {
  key: 'userInfo',
  default: () => ({
    user: undefined
  })
})
const { user, logout } = useAuth()

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
const contentBGDark = "02061880"
const primaryBGLight = "0f172bff"
const contentBGLight = "ffffff80"

const spring = createSpring({
  stiffness: 200,
  damping: 50,
  velocity: 18,
})

const getRelativePosition = (element: HTMLElement, container: HTMLElement) => {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  return {
    top: elementRect.top - containerRect.top,
    left: elementRect.left - containerRect.left,
    right: containerRect.right - elementRect.right,
    bottom: containerRect.bottom - elementRect.bottom,
    width: elementRect.width,
    height: elementRect.height
  };
}

watch(() => colorMode.value, () => {
  if (showUserPanel.value) {
    animate(".user-panel-backdrop", {
      backgroundColor: `#${colorMode.value == "dark" ? contentBGDark : contentBGLight}`,
      duration: 200,
    })
  } else {
    animate(".user-panel-backdrop", {
      backgroundColor: `#${colorMode.value == "dark" ? primaryBGDark : primaryBGLight}`,
      duration: 200,
    })
  }
})

const getAvatarAndNamePosition = async () => {
  showUserPanelDOM.value = true
  showUserInfo.value = true
  await nextTick()

  const userAvatar = document.querySelector(".user-avatar") as HTMLElement
  const userName = document.querySelector(".user-name") as HTMLElement
  const userPanelRoot = document.querySelector(".user-panel-root") as HTMLElement

  if(!userAvatar || !userName || !userPanelRoot) {
    console.warn("User avatar, user name or user panel root not found")
    return {
      imageRelativePosition: undefined,
      nameRelativePosition: undefined
    }
  }

  const imageRelativePosition = getRelativePosition(userAvatar, userPanelRoot)
  const nameRelativePosition = getRelativePosition(userName, userPanelRoot)
  return {
    imageRelativePosition,
    nameRelativePosition
  }
}

const openUserPanel = async () => {
  const { imageRelativePosition, nameRelativePosition } = await getAvatarAndNamePosition()
  if(!imageRelativePosition || !nameRelativePosition) {
    console.warn("Image relative position or name relative position not found")
    return
  }

  showUserPanel.value = true
  showUserPanelDOM.value = true
  showUserInfo.value = false
  await nextTick()

  const userPanelRoot = document.querySelector(".user-panel-root") as HTMLElement
  const userPanelBackdrop = document.querySelector(".user-panel-backdrop") as HTMLElement
  const userPanelAvatar = document.querySelector(".user-panel-avatar") as HTMLElement
  const userPanelName = document.querySelector(".user-panel-name") as HTMLElement

  if(!userPanelBackdrop || !userPanelAvatar || !userPanelName || !userPanelRoot) {
    console.warn("User panel backdrop, avatar, name or root not found")
    return
  }
  const backdropEndWidth = userPanelRoot.clientWidth || 240
  const backdropEndHeight = userPanelRoot.clientHeight || 500

  const imageEndPosition = {right: 150, top: 28}
  const nameEndPosition = {right: 130 - nameRelativePosition.width * 1.3, top: 36}

  userPanelAvatar.style.transformOrigin = `top right`
  userPanelName.style.transformOrigin = `top right`
  userPanelAvatar.style.top = `${imageRelativePosition.top}px`
  userPanelAvatar.style.right = `${imageRelativePosition.right}px`
  userPanelName.style.top = `${nameRelativePosition.top}px`
  userPanelName.style.right = `${nameRelativePosition.right}px`

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
    backgroundColor: `#${colorMode.value == "dark" ? contentBGDark: contentBGLight}`,
    ease: spring,
  }, 0)
  timeline.add(userPanelAvatar, {
    scale: 4,
    right: `${imageEndPosition.right}px`,
    top: `${imageEndPosition.top}px`,
    ease: "outQuart",
    duration: 350,
  }, 0)
  timeline.add(userPanelName, {
    scale: 1.3,
    fontWeight: 500,
    right: `${nameEndPosition.right}px`,
    top: `${nameEndPosition.top}px`,
    ease: spring
  }, 0)
  timeline.add(".user-panel-header, .user-panel-content", {
    opacity: 1,
    ease: spring
  }, 150)
}

const closeUserPanel = async (callback: () => void = () => {}) => {
  
  const { imageRelativePosition, nameRelativePosition } = await getAvatarAndNamePosition()
  if(!imageRelativePosition || !nameRelativePosition) {
    console.warn("Image relative position or name relative position not found")
    return
  }

  showUserPanel.value = false
  showUserPanelDOM.value = true
  showUserInfo.value = false
  await nextTick()

  
  const userPanelRoot = document.querySelector(".user-panel-root") as HTMLElement
  const userPanelBackdrop = document.querySelector(".user-panel-backdrop") as HTMLElement
  const userPanelAvatar = document.querySelector(".user-panel-avatar") as HTMLElement
  const userPanelName = document.querySelector(".user-panel-name") as HTMLElement

  if(!userPanelBackdrop || !userPanelAvatar || !userPanelName || !userPanelRoot) {
    console.warn("User panel backdrop, avatar, name or root not found")
    return
  }

  const imageStartPosition = {right: 150, top: 28}
  const nameStartPosition = {right: 130 - nameRelativePosition.width * 1.3, top: 36}

  userPanelAvatar.style.transformOrigin = `top right`
  userPanelName.style.transformOrigin = `top right`
  userPanelAvatar.style.top = `${imageStartPosition.top}px`
  userPanelAvatar.style.right = `${imageStartPosition.right}px`
  userPanelName.style.top = `${nameStartPosition.top}px`
  userPanelName.style.right = `${nameStartPosition.right}px`

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
  timeline.add(userPanelAvatar, {
    scale: 1,
    right: `${imageRelativePosition.right}px`,
    top: `${imageRelativePosition.top}px`,
    ease: spring,
  }, 0)
  timeline.add(userPanelName, {
    scale: 1,
    fontWeight: 100,
    right: `${nameRelativePosition.right}px`,
    top: `${nameRelativePosition.top}px`,
    ease: spring,
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
      <template v-if="showUserInfo">
        <div class="user-avatar">
          <Image :src="user.data.value.avatarUrl || '/images/default_avatar.jpg'" alt="avatar" :img-attrs="{class: 'w-5 h-5'}" />
        </div>
        <span class="user-name">{{ user.data.value.nickName || user.data.value.userName }}</span>
      </template>

      <div class="user-panel-toggle" :class="{'user-panel-toggle--interactive': !showUserPanel}" @click="onToggleClicked">
        <Icon name="lucide:align-justify" size="14" class="user-panel-toggle-icon" :class="{'user-panel-toggle-icon--light-open': colorMode.value == 'light' && showUserPanel}" />
        <div v-show="showUserPanelDOM" class="user-panel-root">
          <div class="user-panel-backdrop" />
          <div class="user-panel-header">
            <Widget-ThemeSwitcher class="rounded-full" />
            <Button variant="ghost" size="icon" class="w-7 h-7 rounded-full" @click.stop="toggleUserPanel">
              <Icon name="lucide:align-justify" size="14" />
            </Button>
          </div>
          <div class="user-panel-avatar">
            <Image :src="user.data.value.avatarUrl || '/images/default_avatar.jpg'" alt="avatar" :img-attrs="{class: 'w-5 h-5'}" />
          </div>
          <span class="user-panel-name">{{ user.data.value.nickName || user.data.value.userName }}</span>
          <div class="user-panel-content">
            <div class="user-panel-user-info">
              <Button variant="outline" size="sm" class="h-8 rounded-full">
                <Icon name="lucide:user" size="16" /> Profile
              </Button>
              <Button variant="outline" size="icon" class="w-8 h-8 rounded-full" @click.stop="handleLogout">
                <Icon name="lucide:log-out" size="16" />
              </Button>
            </div>
            <div class="user-panel-inbox">
              <div class="user-panel-inbox-header">
                <p class="user-panel-inbox-title"><Icon name="lucide:inbox" size="16" /> Inbox</p>
                <button class="user-panel-inbox-mark-read"><Icon name="lucide:check" size="16" /> Mark all as read</button>
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
  @apply absolute top-0 right-0 z-0 rounded-[17px] backdrop-blur-lg shadow-2xl;
}

/* User panel header styles */
.user-panel-header {
  @apply flex justify-end gap-2;
}

/* User panel avatar styles */
.user-panel-avatar {
  @apply absolute w-5 h-5 rounded-full flex items-center justify-center overflow-hidden;
  transform-origin: top right;
}

/* User panel name styles */
.user-panel-name {
  @apply text-xs absolute scale-100;
  transform-origin: top right;
}

/* User panel content styles */
.user-panel-content {
  @apply p-2.5 flex flex-col relative;
}

/* User panel user info styles */
.user-panel-user-info {
  @apply flex items-center gap-2 ml-23 mt-8 mb-4.5 relative;
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