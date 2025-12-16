import { createContext } from 'reka-ui'

export const SIDEBAR_STORAGE_KEY = 'sidebar_state'
export const SIDEBAR_WIDTH = '16rem'
export const SIDEBAR_WIDTH_MOBILE = '18rem'
export const SIDEBAR_WIDTH_ICON = '3.5rem'
export const SIDEBAR_KEYBOARD_SHORTCUT = 'b'

// Cookie-based sidebar state management for SSR compatibility
export function useSidebarState(defaultValue = true) {
  const sidebarCookie = useCookie<boolean>(SIDEBAR_STORAGE_KEY, {
    default: () => defaultValue,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false, // Needs to be accessible on client side
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })

  const setSidebarState = (value: boolean) => {
    sidebarCookie.value = value
  }

  return {
    sidebarState: sidebarCookie,
    setSidebarState,
  }
}

export const [useSidebar, provideSidebarContext] = createContext<{
  state: ComputedRef<'expanded' | 'collapsed'>
  open: Ref<boolean>
  setOpen: (value: boolean) => void
  isMobile: Ref<boolean>
  openMobile: Ref<boolean>
  setOpenMobile: (value: boolean) => void
  toggleSidebar: () => void
}>('Sidebar')
