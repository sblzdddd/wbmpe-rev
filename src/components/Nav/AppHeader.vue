<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { createSpring, createTimeline, type Timeline, animate } from 'animejs'
import { useAuth } from '~/composables/useAuth'
import { useDialog, DialogType } from '~/composables/useDialog'
import { useSidebar } from '~/components/ui/sidebar/utils'
import { useScroll } from '~/composables/useScroll'

const colorMode = useColorMode()
const { isOnTop } = useScroll()
const route = useRoute()
const { open } = useSidebar()
const { openDialog } = useDialog()
const { user, isAuthenticated, logout } = useAuth()


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
const spring = createSpring({
  stiffness: 150,
  damping: 26,
  velocity: 13,
})
let timeline: Timeline;

const primaryBGDark = "648dfeff"
const contentBGDark = "02061880"
const primaryBGLight = "0f172bff"
const contentBGLight = "ffffff80"

const getRelativePosition = (element: HTMLElement, container: HTMLElement) => {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  console.log("elementRect", elementRect)
  console.log("containerRect", containerRect)

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

  console.log(userAvatar, userName, userPanelRoot)

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

  console.log(backdropEndWidth, backdropEndHeight)

  const imageEndPosition = {right: 150, top: 28}
  const nameEndPosition = {right: 92, top: 36}

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
    ease: spring,
  }, 50)
  timeline.add(userPanelName, {
    scale: 1.3,
    right: `${nameEndPosition.right}px`,
    top: `${nameEndPosition.top}px`,
    ease: spring,
  }, 50)
  timeline.add(".user-panel-header, .user-panel-content", {
    opacity: 1,
    ease: spring,
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
  const backdropEndWidth = userPanelRoot.clientWidth || 240
  const backdropEndHeight = userPanelRoot.clientHeight || 500

  console.log(backdropEndWidth, backdropEndHeight)

  const imageStartPosition = {right: 150, top: 28}
  const nameStartPosition = {right: 92, top: 36}

  userPanelAvatar.style.transformOrigin = `top right`
  userPanelName.style.transformOrigin = `top right`
  userPanelAvatar.style.top = `${imageStartPosition.top}px`
  userPanelAvatar.style.right = `${imageStartPosition.right}px`
  userPanelName.style.top = `${nameStartPosition.top}px`
  userPanelName.style.right = `${nameStartPosition.right}px`
  
  showUserPanelDOM.value = false

  const size = document.querySelector(".user-panel-toggle")?.clientWidth || 28
  if (timeline) {
    timeline.cancel()
  }
  await nextTick()
  timeline = createTimeline({onComplete: () => {
    showUserPanelDOM.value = false
    showUserInfo.value = true
    callback()
  }})
  timeline.add(".user-panel-header, .user-panel-content", {
    opacity: 0,
    ease: spring,
  }, 0)
  timeline.add(userPanelAvatar, {
    scale: 1,
    right: `${imageRelativePosition.right}px`,
    top: `${imageRelativePosition.top}px`,
    ease: spring,
  }, 50)
  timeline.add(userPanelName, {
    scale: 1,
    right: `${nameRelativePosition.right}px`,
    top: `${nameRelativePosition.top}px`,
    ease: spring,
  }, 50)
  timeline.add(userPanelBackdrop, {
    scale: 1,
    width: `${size}px`,
    height: `${size}px`,
    right: "0px",
    top: "0px",
    backgroundColor: `#${colorMode.value == "dark" ? primaryBGDark : primaryBGLight}`,
    ease: spring,
  }, 150)
}

const onToggleClicked = () => {
  if(showUserPanel) {toggleUserPanel()} 
}
// // Close panel when clicking outside
// onMounted(() => {
//   document.addEventListener('keydown', (e) => {
//     if (e.key === 'Escape' && showUserPanel.value) {
//       closeUserPanel()
//     }
//   })
// })
</script>

<template>
  <header class="sticky top-0 flex h-16 shrink-0 items-center gap-2 z-[50] transition-[background-color,border-color] duration-200" :class="isOnTop ? '' : 'bg-sidebar border-b-[1.5px] h-[65px]'">
    <div class="flex items-center gap-1 pl-2">
      <template v-if="!open">
        <Image v-if="colorMode.value === 'dark'" src="/images/logo/logo-dark_256.png" alt="logo" img-class="w-36" />
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
          <div class="user-info-root text-sm flex items-center gap-2">
            <template v-if="showUserInfo">
              <div class="user-avatar w-5 h-5 rounded-full flex items-center justify-center overflow-hidden">
                <Image v-if="user.avatarUrl" :src="user.avatarUrl" alt="avatar" img-class="w-5 h-5" />
                <div v-else class="w-5 h-5 bg-primary" />
              </div>
              <span class="user-name text-xs">{{ user.nickName || user.userName }}</span>
            </template>

            <div class="user-panel-toggle rounded-full w-7 h-7 relative flex items-center justify-center bg-primary" @click.stop="onToggleClicked">
              <Icon name="lucide:align-justify" size="14" class="z-20 text-white" :class="{'!text-black': colorMode.value == 'light' && showUserPanel}" />
              <div v-show="showUserPanelDOM" class="user-panel-root absolute top-0 right-0 flex flex-col rounded-lg">
                <div class="user-panel-backdrop absolute top-0 right-0 z-0 rounded-lg backdrop-blur-lg" />
                <div class="user-panel-header flex justify-end gap-2">
                  <Widget-ThemeSwitcher />
                  <Button variant="ghost" size="icon" class="w-7 h-7" @click.stop="toggleUserPanel">
                    <Icon name="lucide:align-justify" size="14" />
                  </Button>
                </div>
                <div class="user-panel-avatar absolute w-5 h-5 rounded-full flex items-center justify-center overflow-hidden" style="transform-origin: top right;">
                  <Image v-if="user.avatarUrl" :src="user.avatarUrl" alt="avatar" img-class="user-panel-avatar w-5 h-5" />
                  <div v-else class="user-panel-avatar w-5 h-5 bg-primary" />
                </div>
                <span class="user-panel-name text-xs absolute scale-100" style="transform-origin: top right;">{{ user.nickName || user.userName }}</span>
                <div class="user-panel-content p-2.5 flex flex-col relative">
                  <div class="user-panel-user-info flex items-center gap-2 ml-23 mt-8 mb-4.5 relative">
                    <Button variant="outline" size="sm" class="h-8 rounded-full">
                      <Icon name="lucide:user" size="16" /> Profile
                    </Button>
                    <Button variant="outline" size="icon" class="w-8 h-8 rounded-full" @click.stop="handleLogout">
                      <Icon name="lucide:log-out" size="16" />
                    </Button>
                  </div>
                  <div class="user-panel-inbox flex flex-col items-start gap-2 py-2 px-1 border-t border-border">
                    <div class="flex justify-between w-full items-center">
                      <p class="text-sm inline-flex items-center gap-2"><Icon name="lucide:inbox" size="16" /> Inbox</p>
                      <button class="bg-none cursor-pointer text-xs opacity-50 flex items-center gap-1"><Icon name="lucide:check" size="16" /> Mark all as read</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Button v-else variant="ghost" size="icon" class="h-8 w-20 mr-2" @click.stop="openDialog?.call(null, DialogType.LOGIN)">
          <Icon name="lucide:user" size="16" /> 
          <span class="text-xs mb-0.5">Login</span>
        </Button>
        <Auth-LoginDialog />
        <Auth-ForgotPasswordDialog />
        <Widget-WindowButtons/>
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
