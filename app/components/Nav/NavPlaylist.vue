<script setup lang="ts">
import { motion } from "motion-v"
import type { RoutePath } from "#types/Utils/RoutePath"
import type { PlaylistMeta } from "#types/Playlist"

defineProps<{
  data: PlaylistMeta[]
}>()

const { isOnTop } = useScrollBar()

const routePath = useState<RoutePath>('routePath')
</script>

<template>
  <SidebarSeparator class="m-0 opacity-0 group-data-[collapsible=icon]:opacity-100" :class="{'!opacity-0': isOnTop}" />
  <SidebarGroup>
    <SidebarGroupLabel class="pl-4 mb-2 group-data-[collapsible=icon]:hidden">My Playlists</SidebarGroupLabel>
    <SidebarMenu>
      <SidebarMenuItem v-for="item in data" :key="item.name">
        <NuxtLink :to="`/playlists/${item._id}`">
          <ContextMenu>
            <ContextMenuTrigger>
              <SidebarMenuButton
                :id="`/playlists/${item._id}`" class="menu-btn" :tooltip="item.name" 
                :class="{'nav-active': `/playlists/${item._id}` == routePath.next, 'group-data-[collapsible=icon]:p-2.5!': !item.coverUrl, 'image-icon': item.coverUrl}">
                <Image v-if="item.coverUrl" :src="item.coverUrl" class="nav-icon w-5 h-5 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-1 shrink-0 rounded-md z-10" :modifiers="{resize: {s: 100}}" :alt="item.name" />
                <Icon v-else name="lucide:list-music" size="17" class="nav-icon group-data-[collapsible=icon]:p-2.5! shrink-0" />
                <span class="ml-2 text-sm">{{ item.name }}</span>
              </SidebarMenuButton>
            </ContextMenuTrigger>
            <ContextMenuContent
              class="w-48 rounded-lg"
              side="bottom"
              align="end"
            >
              <NuxtLink v-if="true" :to="`/playlists/${item._id}/edit`">
                <ContextMenuItem>
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
            v-if="routePath.next.includes(`/playlists/${item._id}`)" 
            layout
            layout-id="nav-highlighter" 
            class="absolute inset-0 bg-black/15 dark:bg-white/15 rounded-md" 
            :transition="{ type: 'spring', stiffness: 400, damping: 30, mass: 1 }"
          />
        </NuxtLink>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <NuxtLink to="/playlists/create">
          <SidebarMenuButton class="menu-btn group-data-[collapsible=icon]:p-2.5!" :tooltip="'Create Playlist'" :class="{'nav-active': routePath.next == '/playlists/create'}">
            <Icon name="lucide:plus" size="17" class="nav-icon group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-2.5! shrink-0" />
            <span class="ml-2 text-sm">Create Playlist</span>
          </SidebarMenuButton>
          <motion.div 
            v-if="routePath.next == '/playlists/create'" 
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
<style>
@reference "../../assets/css/tailwind.css";
.image-icon {
  &:is(:where(.group)[data-collapsible="icon"] *) {
    padding: 0rem !important;
  }
}
</style>
