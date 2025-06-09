<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar'
import { animate, createSpring } from 'animejs'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar'

const {open} = useSidebar()

const router = useRouter()
const route = useRoute()

router.beforeEach(async (to, from, next) => {
  const navItem = document.getElementById(to.path)
  const lastNavItem = document.getElementById(from.path)
  let lastNavItemRect = null
  if(lastNavItem) {
    lastNavItem.classList.remove('nav-active')
    lastNavItemRect = lastNavItem.getBoundingClientRect()
  }
  if (!navItem) return next()
  navItem.classList.add('nav-active')
  const rect = navItem.getBoundingClientRect()
  const highlighter = document.getElementById('nav-highlighter')
  if(!highlighter) return
  // animation principle of speed deform
  let scaleMultiplier = 1
  if(lastNavItemRect) {
    const distance = lastNavItemRect.top - rect.top
    scaleMultiplier = 1 + (Math.abs(distance) / 80)
    if(open) scaleMultiplier /= 1.2;
    highlighter.style.width = `${lastNavItemRect.width}px`
    highlighter.style.height = `${lastNavItemRect.height * scaleMultiplier}px`
    highlighter.style.left = `${lastNavItemRect.left}px`
    highlighter.style.top = `${lastNavItemRect.top - (distance > 0 ? lastNavItemRect.height * (scaleMultiplier - 1):0)}px`
  }
  animate(highlighter, {
    width: rect.width,
    height: rect.height,
    left: rect.left,
    top: rect.top,
    duration: 100,
    ease: createSpring({ velocity: 14, stiffness: 140, damping: 30 })
  })
  next()
})

watch(open, async () => {
  const highlighter = document.getElementById('nav-highlighter')
  const activeNavItem = document.querySelector('.nav-active')
  if(!highlighter || !activeNavItem) return
  await nextTick()
  const rect = activeNavItem.getBoundingClientRect()
  animate(highlighter, {
    width: rect.width,
    height: rect.height,
    left: rect.left,
    top: rect.top,
    ease: createSpring({ velocity: 14, stiffness: 140, damping: 30 })
  })
})

onMounted(() => {
  const navItem = document.getElementById(route.path)
  if(navItem) {
    navItem.classList.add('nav-active')
    const rect = navItem.getBoundingClientRect()
    const highlighter = document.getElementById('nav-highlighter')
    if(!highlighter) return
    highlighter.style.width = `${rect.width}px`
    highlighter.style.height = `${rect.height}px`
    highlighter.style.left = `${rect.left}px`
    highlighter.style.top = `${rect.top}px`
    highlighter.style.opacity = '1'
  }
})

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})

// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      name: "Discover",
      items: [
        {
          title: 'Your Daily',
          url: '/',
          icon: 'lucide:home',
          isActive: true,
        },
        {
          title: 'Explore',
          url: '/explore',
          icon: 'lucide:compass',
        },
        {
          title: 'Search',
          url: '/search',
          icon: 'lucide:search',
        },
        {
          title: 'WSP',
          url: '/wsp',
          icon: 'lucide:share-2',
        },
      ]
    },
    {
      name: "Library",
      items: [
        {
          title: 'Songs',
          url: '/songs',
          icon: 'lucide:music',
          isActive: true,
        },
        {
          title: 'Albums',
          url: '/albums',
          icon: 'lucide:disc-album',
        },
        {
          title: 'Artists',
          url: '/artists',
          icon: 'lucide:user',
        },
        {
          title: 'Playlists',
          url: '/playlists',
          icon: 'lucide:list-video',
        },
      ]
    },
  ],
  playlist: [
    {
      name: 'Design Engineering',
      url: '#',
      icon: 'lucide:frame',
    },
    {
      name: 'Sales & Marketing',
      url: '#',
      icon: 'lucide:pie-chart',
    },
    {
      name: 'Travel',
      url: '#',
      icon: 'lucide:map',
    },
  ],
}
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <NavTitle />
    </SidebarHeader>
    <SidebarContent class="gap-0">
      <div id="nav-highlighter" class="fixed bg-black/15 dark:bg-accent rounded-md opacity-0 transition-opacity duration-200" />
      <NavMain :data="data.navMain" />
      <NavPlaylist :data="data.playlist" />
    </SidebarContent>
    <!-- <SidebarFooter>
      <NavUser :user="data.user" />
    </SidebarFooter> -->
  </Sidebar>
</template>
