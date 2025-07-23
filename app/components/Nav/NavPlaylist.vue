<script setup lang="ts">
import { motion } from "motion-v"

defineProps<{
  data: {
    name: string
    url: string
    icon: string
    canEdit: boolean
  }[]
}>()

const { isOnTop } = useScrollBar()
const nextPath = useState('nextPath')
</script>

<template>
  <SidebarSeparator class="m-0 opacity-0 group-data-[collapsible=icon]:opacity-100" :class="{'!opacity-0': isOnTop}" />
  <SidebarGroup>
    <SidebarGroupLabel class="pl-4 mb-2 group-data-[collapsible=icon]:hidden">My Playlists</SidebarGroupLabel>
    <SidebarMenu>
      <SidebarMenuItem v-for="item in data" :key="item.name">
        <NuxtLink :to="item.url">
          <ContextMenu>
            <ContextMenuTrigger>
              <SidebarMenuButton :id="item.url" class="menu-btn" :tooltip="item.name" :class="{'nav-active': item.url == nextPath}">
                <Icon v-if="item.icon" :name="item.icon" size="17" class="nav-icon group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-2.5! shrink-0" />
                <span class="ml-2 text-sm">{{ item.name }}</span>
              </SidebarMenuButton>
            </ContextMenuTrigger>
            <ContextMenuContent
              class="w-48 rounded-lg"
              side="bottom"
              align="end"
            >
              <NuxtLink v-if="item.canEdit" :to="`/playlists/${item.url.split('/').pop()}/edit`">
                <ContextMenuItem v-if="item.canEdit">
                  <Icon name="lucide:edit" size="17" class="text-muted-foreground" />
                  <span>Edit Playlist</span>
                </ContextMenuItem>
              </NuxtLink>
              <ContextMenuItem>
                <Icon name="lucide:share" size="17" class="text-muted-foreground" />
                <span>Share Playlist</span>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          <motion.div 
            v-if="item.url == (nextPath as string || '').replace('/edit', '')" 
            layout
            layout-id="nav-highlighter" 
            class="absolute inset-0 bg-black/15 dark:bg-white/15 rounded-md" 
            :transition="{ type: 'spring', stiffness: 400, damping: 30, mass: 1 }"
          />
        </NuxtLink>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</template>
