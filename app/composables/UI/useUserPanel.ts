

// Color constants
const primaryBGDark = "648dfeff"
const contentBGDark = "02061880"
const contentBGDarkSolid = "0c1327"
const primaryBGLight = "5f87f8ff"
const contentBGLight = "ffffff90"
const contentBGLightSolid = "ffffff"

export const useUserPanel = () => {
  const colorMode = useColorMode()
  const { isOnTop } = useScrollBar()

  const userPanelState = useState('userPanelState', () => ({
    showUserPanel: false,
    showUserPanelDOM: false,
  }))

  let timeline: Timeline;

  // Watch for color mode changes
  watch(() => colorMode.value, () => {
    if (userPanelState.value.showUserPanel) {
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

  // Watch for scroll position changes
  watch(() => isOnTop.value, () => {
    if (!userPanelState.value.showUserPanel) return;
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
    userPanelState.value.showUserPanel = true
    userPanelState.value.showUserPanelDOM = true
    await nextTick()

    const userPanelRoot = document.querySelector(".user-panel-root") as HTMLElement
    const userPanelBackdrop = document.querySelector(".user-panel-backdrop") as HTMLElement

    if(!userPanelBackdrop || !userPanelRoot) {
      console.warn("User panel backdrop or root not found")
      return
    }
    const backdropEndWidth = userPanelRoot.clientWidth || 240
    const backdropEndHeight = userPanelRoot.clientHeight || 500

    const padding = 8

    await nextTick()
    if (timeline) {
      timeline.cancel()
    }
    timeline = createTimeline({onComplete: () => {
      userPanelState.value.showUserPanelDOM = true
    }})
    timeline.add(userPanelBackdrop, {
      scale: 1,
      width: `${backdropEndWidth + padding * 2}px`,
      height: `${backdropEndHeight + padding * 2}px`,
      right: `-${padding}px`,
      top: `-${padding}px`,
      backgroundColor: `#${isOnTop.value ? colorMode.value == "dark" ? contentBGDark: contentBGLight : colorMode.value == "dark" ? contentBGDarkSolid: contentBGLightSolid}`,
      ease: "outQuint",
      duration: 300,
    }, 0)
    timeline.add(".user-panel-header, .user-panel-content", {
      opacity: 1,
      ease: "outQuint",
      duration: 300,
    }, 150)
  }

  const closeUserPanel = async (callback: () => void = () => {}) => {
    userPanelState.value.showUserPanel = false
    userPanelState.value.showUserPanelDOM = true
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
      userPanelState.value.showUserPanelDOM = false
      callback()
    }})
    timeline.add(".user-panel-header, .user-panel-content", {
      opacity: 0,
      ease: "outQuint",
      duration: 300
    }, 0)
    timeline.add(userPanelBackdrop, {
      scale: 1,
      width: `${size}px`,
      height: `${size}px`,
      right: "0px",
      top: "0px",
      backgroundColor: `#${colorMode.value == "dark" ? primaryBGDark : primaryBGLight}`,
      ease: "outQuint",
      duration: 300,
    }, 0)
  }

  const toggleUserPanel = () => {
    if (userPanelState.value.showUserPanel) {
      closeUserPanel()
    } else {
      openUserPanel()
    }
  }

  const onToggleClicked = () => {
    if(!userPanelState.value.showUserPanel) {toggleUserPanel()} 
  }

  // Outside click detection
  const handleOutsideClick = (event: MouseEvent) => {
    if (!userPanelState.value.showUserPanel) return
    
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

  return {
    // State
    showUserPanel: computed(() => userPanelState.value.showUserPanel),
    showUserPanelDOM: computed(() => userPanelState.value.showUserPanelDOM),
    isOnTop: computed(() => isOnTop.value),
    
    // Methods
    openUserPanel,
    closeUserPanel,
    toggleUserPanel,
    onToggleClicked,
  }
}
