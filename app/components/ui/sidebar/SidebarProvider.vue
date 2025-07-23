<script setup lang="ts">
import { useEventListener, useMediaQuery, useVModel } from '@vueuse/core'
import { TooltipProvider } from 'reka-ui'
import { cn } from '@/lib/utils'
import { provideSidebarContext, SIDEBAR_KEYBOARD_SHORTCUT, SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON, useSidebarState } from './utils'

const props = withDefaults(defineProps<{
  defaultOpen?: boolean
  open?: boolean
  class?: HTMLAttributes['class']
}>(), {
  defaultOpen: true,
  open: undefined,
})

const emits = defineEmits<{
  'update:open': [open: boolean]
}>()

const isMobile = useMediaQuery('(max-width: 768px)')
const openMobile = ref(false)

// Use cookie-based state management for SSR compatibility
const { sidebarState, setSidebarState: saveSidebarState } = useSidebarState(props.defaultOpen ?? true)

const open = useVModel(props, 'open', emits, {
  defaultValue: props.open !== undefined ? props.open : sidebarState.value,
  passive: (props.open === undefined) as false,
}) as Ref<boolean>

// Sync the open state with the cookie when not controlled by props
if (props.open === undefined) {
  // Initialize from cookie state
  open.value = sidebarState.value
  
  // Watch for changes and save to cookie
  watch(open, (newValue) => {
    saveSidebarState(newValue)
  }, { immediate: false })
}

function setOpen(value: boolean) {
  open.value = value // emits('update:open', value)
  
  // Save the sidebar state to cookie (only when not controlled by props)
  if (props.open === undefined) {
    saveSidebarState(value)
  }
}

function setOpenMobile(value: boolean) {
  openMobile.value = value
}

// Helper to toggle the sidebar.
function toggleSidebar() {
  return isMobile.value ? setOpenMobile(!openMobile.value) : setOpen(!open.value)
}

useEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    toggleSidebar()
  }
})

// We add a state so that we can do data-state="expanded" or "collapsed".
// This makes it easier to style the sidebar with Tailwind classes.
const state = computed(() => open.value ? 'expanded' : 'collapsed')

provideSidebarContext({
  state,
  open,
  setOpen,
  isMobile,
  openMobile,
  setOpenMobile,
  toggleSidebar,
})
</script>

<template>
  <div
    data-slot="sidebar-wrapper"
    :style="{
      '--sidebar-width': SIDEBAR_WIDTH,
      '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
    }"
    :class="cn('group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full', props.class)"
    v-bind="$attrs"
  >
    <TooltipProvider :delay-duration="0">
      <slot />
    </TooltipProvider>
  </div>
</template>
