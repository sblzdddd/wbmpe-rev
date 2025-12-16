<script setup lang="ts">
import Button from '../ui/button/Button.vue';
import { SidebarMenu, SidebarMenuItem } from '#imports';
import Image from '../Image.vue';

const colorMode = useColorMode()
const { toggleSidebar } = useSidebar()

const logoSrc = computed(() => {
  return colorMode.value === 'dark' 
    ? '/images/logo/logo-dark_256.png' 
    : '/images/logo/logo-light_256.png'
})
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <div class="flex w-full items-center gap-4.5 overflow-hidden py-1.5 text-left outline-hidden group-data-[collapsible=icon]:size-12! [&>span:last-child]:truncate text-sm group-data-[collapsible=icon]:p-0!">
        
        <Button variant="ghost" size="icon" class="ml-0.5" @click.stop="toggleSidebar()">
          <Icon name="lucide:menu" size="20" />
        </Button>
        <ClientOnly fallback-tag="div">
          <Image :src="logoSrc" alt="logo" :img-attrs="{class: 'w-36 mr-auto group-data-[collapsible=icon]:hidden'}" />
          <template #fallback>
            <!-- Fallback for SSR - use a neutral logo -->
            <Image src="/images/logo/logo-light_256.png" alt="logo" :img-attrs="{class: 'w-36 mr-auto group-data-[collapsible=icon]:hidden'}" />
          </template>
        </ClientOnly>
      </div>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
