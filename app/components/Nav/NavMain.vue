<script setup lang="ts">
import { motion } from "motion-v"
import type { RoutePath } from "#types/Utils/RoutePath"

defineProps<{
  data: {
    name: string
    items: {
      title: string
      url: string
      icon?: string
      isActive?: boolean
    }[]
  }[]
}>()
const { isOnTop } = useScrollBar()

const routePath = useState<RoutePath>('routePath')

</script>

<template>
  <template v-for="group in data" :key="group.name">
    <SidebarSeparator class="m-0 opacity-0 group-data-[collapsible=icon]:opacity-100" :class="{'!opacity-0': isOnTop}" />
    <SidebarGroup>
      <SidebarGroupLabel class="pl-4 mb-2 group-data-[collapsible=icon]:hidden">{{ group.name }}</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem v-for="item in group.items" :key="item.title">
          <NuxtLink :to="item.url">
            <SidebarMenuButton :id="item.url" class="menu-btn group-data-[collapsible=icon]:p-2.5!" :tooltip="item.title" :class="{'nav-active': item.url == routePath.next}">
              <Icon v-if="item.icon" :name="item.icon" size="17" class="nav-icon group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-2.5! shrink-0" />
              <span class="ml-2 text-sm">{{ item.title }}</span>
            </SidebarMenuButton>
            <motion.div
              v-if="item.url == routePath.next"
              layout-id="nav-highlighter"
              class="absolute inset-0 bg-black/15 dark:bg-white/15 rounded-md" 
              :transition="{ type: 'spring', stiffness: 400, damping: 30, mass: 1 }"
              :initial="false"
            />
          </NuxtLink>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  </template>
</template>
<style>
@reference '../../assets/css/tailwind.css';
.menu-btn {
  @apply py-4 pl-4 hover:!bg-transparent relative overflow-hidden;
  &:is(.dark *) {
    &:before {
      @apply bg-white/15;
    }
  }
  &:before {
    @apply bg-black/15  content-[''] absolute top-0 left-0 w-[70%] h-full opacity-0 transition-all ease-out duration-150 rounded-md;
    transform-origin: left;
  }
  &:is(:where(.group)[data-collapsible="icon"] *):before {
    @apply w-full scale-0 opacity-0 duration-200;
    transform-origin: center;
  }
  &:hover:before {
    @apply w-full scale-100 opacity-100;
  }
  &:active:before {
    @apply w-full scale-90 opacity-100;
  }
  &.nav-active:before {
    @apply !opacity-0 !duration-0;
  }
  span {
    @apply z-10;
  }
}
</style>
