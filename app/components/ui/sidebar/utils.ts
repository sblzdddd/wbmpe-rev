import type { ComputedRef, Ref } from 'vue'
import { createContext } from 'reka-ui'

export const SIDEBAR_STORAGE_KEY = 'sidebar_state'
export const SIDEBAR_WIDTH = '16rem'
export const SIDEBAR_WIDTH_MOBILE = '18rem'
export const SIDEBAR_WIDTH_ICON = '3.5rem'
export const SIDEBAR_KEYBOARD_SHORTCUT = 'b'

// Local storage helper functions
export function getSidebarState(): boolean | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
  return stored ? JSON.parse(stored) : null
}

export function setSidebarState(value: boolean): void {
  if (typeof window === 'undefined') return
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
