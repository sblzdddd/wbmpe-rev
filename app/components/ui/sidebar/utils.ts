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

  const getSidebarState = () => {
    return sidebarCookie.value
  }

  return {
    sidebarState: sidebarCookie,
    setSidebarState,
    getSidebarState,
  }
}

// Legacy functions for backward compatibility (now use cookies)
export function getSidebarState(): boolean | null {
  // For SSR compatibility, we can't access localStorage during server-side rendering
  // Instead, we should use the useSidebarState composable
  if (typeof window === 'undefined') return null
  
  // Fallback to localStorage for any existing usage, but migrate to cookie
  const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
  if (stored) {
    const value = JSON.parse(stored)
    // Migrate to cookie and remove from localStorage
    const { setSidebarState } = useSidebarState()
    setSidebarState(value)
    localStorage.removeItem(SIDEBAR_STORAGE_KEY)
    return value
  }
  
  return null
}

export function setSidebarState(value: boolean): void {
  // For SSR compatibility, prefer using the useSidebarState composable
  if (typeof window === 'undefined') return
  
  // Legacy localStorage fallback (will be migrated)
  localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(value))
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
